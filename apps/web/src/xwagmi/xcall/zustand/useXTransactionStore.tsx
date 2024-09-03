import React from 'react';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { XChainId } from '@/xwagmi/types';
import { XMessage, XMessageStatus, XTransaction, XTransactionStatus } from '../types';
import { XMessageUpdater, useXMessageStore, xMessageActions } from './useXMessageStore';

type XTransactionStore = {
  transactions: Record<string, XTransaction>;
  get: (id: string | null) => XTransaction | undefined;
  // add: (transaction: XTransaction) => void;
  createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => void;
  success: (id) => void;
  fail: (id) => void;
  onMessageUpdate: (id: string, xMessage: XMessage) => void;
  getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => XTransaction[];
  remove: (id: string) => void;
};

const jsonStorageOptions = {
  reviver: (key, value: any) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else {
      return value;
    }
  },
};

export const useXTransactionStore = create<XTransactionStore>()(
  persist(
    immer((set, get) => ({
      transactions: {},

      get: (id: string | null) => {
        if (id) return get().transactions[id];
      },

      // reserved for future use
      // add: (transaction: XTransaction) => {
      //   set(state => {
      //     state.transactions[transaction.id] = transaction;
      //   });
      // },

      createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => {
        if (!primaryMessage.destinationTransaction) {
          throw new Error('destinationTransaction is not found'); // it should not happen
        }

        const sourceChainId = primaryMessage.destinationChainId;
        const destinationChainId = xTransaction.finalDestinationChainId;

        const sourceTransaction = primaryMessage.destinationTransaction;

        const secondaryMessageId = `${sourceChainId}/${sourceTransaction?.hash}`;
        const secondaryMessage: XMessage = {
          id: secondaryMessageId,
          sourceChainId,
          destinationChainId,
          sourceTransaction: sourceTransaction,
          status: XMessageStatus.REQUESTED,
          events: {},
          destinationChainInitialBlockHeight: xTransaction.finalDestinationChainInitialBlockHeight,
        };

        xMessageActions.add(secondaryMessage);

        set(state => {
          state.transactions[xTransaction.id].secondaryMessageId = secondaryMessageId;
        });
      },

      success: (id: string) => {
        set(state => {
          state.transactions[id].status = XTransactionStatus.success;
        });
      },
      fail: (id: string) => {
        set(state => {
          state.transactions[id].status = XTransactionStatus.failure;
        });
      },

      onMessageUpdate: (id: string, xMessage: XMessage) => {
        console.log('onMessageUpdate', { id, xMessage });
        const xTransaction = get().transactions[id];
        if (!xTransaction) return;

        const isPrimary = xTransaction.primaryMessageId === xMessage.id;
        const isSecondary = xTransaction.secondaryMessageId === xMessage.id;

        if (isPrimary) {
          if (xMessage.status === XMessageStatus.CALL_EXECUTED) {
            if (xTransaction.secondaryMessageRequired) {
              get().createSecondaryMessage(xTransaction, xMessage);
            } else {
              get().success(id);
            }
          }

          if (xMessage.status === XMessageStatus.FAILED) {
            get().fail(id);
          }
        }

        if (isSecondary) {
          if (xMessage.status === XMessageStatus.CALL_EXECUTED) {
            get().success(id);
          }

          if (xMessage.status === XMessageStatus.FAILED) {
            get().fail(id);
          }
        }
      },

      getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => {
        return Object.values(get().transactions)
          .filter((transaction: XTransaction) => {
            return (
              transaction.status !== XTransactionStatus.success &&
              signedWallets.some(wallet => wallet.xChainId === transaction.sourceChainId)
            );
          })
          .sort((a, b) => {
            const aPrimaryMessage = xMessageActions.get(a.primaryMessageId);
            const bPrimaryMessage = xMessageActions.get(b.primaryMessageId);
            if (aPrimaryMessage && bPrimaryMessage) {
              return bPrimaryMessage?.sourceTransaction.timestamp - aPrimaryMessage?.sourceTransaction.timestamp;
            }
            return 0;
          });
      },
      remove: (id: string) => {
        set(state => {
          delete state.transactions[id];
        });
      },
    })),
    {
      name: 'xTransaction-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
      version: 1,
      migrate: (state, version) => {
        return { transactions: {}, currentId: null };
      },
    },
  ),
);

export const xTransactionActions = {
  get: (id: string | null) => {
    return useXTransactionStore.getState().get(id);
  },

  success: (id: string) => {
    useXTransactionStore.getState().success(id);
  },

  fail: (id: string) => {
    useXTransactionStore.getState().fail(id);
  },

  onMessageUpdate: (id: string, xMessage: XMessage) => {
    useXTransactionStore.getState().onMessageUpdate(id, xMessage);
  },

  getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => {
    return useXTransactionStore.getState().getPendingTransactions(signedWallets);
  },

  getByMessageId: (messageId: string) => {
    const transactions = useXTransactionStore.getState().transactions;
    return Object.values(transactions).find(
      transaction => transaction.primaryMessageId === messageId || transaction.secondaryMessageId === messageId,
    );
  },

  remove: (id: string) => {
    useXTransactionStore.getState().remove(id);
  },
};

export const XTransactionUpdater = ({ xTransaction }: { xTransaction: XTransaction }) => {
  useXMessageStore();
  const { primaryMessageId, secondaryMessageId } = xTransaction;

  const primaryMessage = xMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XMessageUpdater xMessage={primaryMessage} />}
      {secondaryMessage && <XMessageUpdater xMessage={secondaryMessage} />}
    </>
  );
};
