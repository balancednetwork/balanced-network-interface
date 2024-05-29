import React from 'react';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  XMessageStatus,
  XMessage,
  XTransaction,
  XTransactionStatus,
  XTransactionInput,
  XTransactionType,
} from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { transactionActions } from './useTransactionStore';
import { XMessageUpdater, useXMessageStore, xMessageActions } from './useXMessageStore';
import { swapMessage } from '../../supply/_components/utils';
import { XChain, XChainId } from '../types';
import { MODAL_ID, modalActions } from './useModalStore';

type XTransactionStore = {
  transactions: Record<string, XTransaction>;
  currentId: string | null;
  get: (id: string | null) => XTransaction | undefined;
  // add: (transaction: XTransaction) => void;
  executeTransfer: (xTransactionInput: XTransactionInput & { cleanupSwap?: () => void }, onSuccess?: () => void) => void;
  createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => void;
  reset: () => void;
  success: (id) => void;
  fail: (id) => void;
  onMessageUpdate: (id: string, xMessage: XMessage) => void;
  getPendingTransactions: (
    signedWallets: { chain: XChain; chainId: XChainId; address: string }[],
  ) => XTransaction[];
};

const iconChainId: XChainId = '0x1.icon';

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
      currentId: null,

      get: (id: string | null) => {
        if (id) return get().transactions[id];
      },

      // reserved for future use
      // add: (transaction: XTransaction) => {
      //   set(state => {
      //     state.transactions[transaction.id] = transaction;
      //   });
      // },

      executeTransfer: async (xTransactionInput: XTransactionInput & { cleanupSwap?: () => void }, onSuccess = () => {}) => {
        const { direction } = xTransactionInput;
        const sourceChainId = direction.from;
        const finalDestinationChainId = direction.to;
        const primaryDestinationChainId = sourceChainId === iconChainId ? finalDestinationChainId : iconChainId;

        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        const finalDstChainXCallService = xCallServiceActions.getXCallService(finalDestinationChainId);
        const primaryDstChainXCallService = xCallServiceActions.getXCallService(primaryDestinationChainId);

        console.log('xTransactionInput', xTransactionInput);

        let sourceTransactionHash;
        if (xTransactionInput.type === XTransactionType.BRIDGE) {
          sourceTransactionHash = await srcChainXCallService.executeTransfer(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.SWAP) {
          sourceTransactionHash = await srcChainXCallService.executeSwap(xTransactionInput);
        } else {
          throw new Error('Unsupported XTransactionType');
        }

        if (!sourceTransactionHash) {
          xTransactionActions.reset();
          return;
        }

        let pendingMessage, successMessage, errorMessage;
        let descriptionAction, descriptionAmount;
        if (xTransactionInput.type === XTransactionType.BRIDGE) {
          pendingMessage = 'Requesting cross-chain transfer...';
          successMessage = 'Cross-chain transfer requested.';
          errorMessage = 'Cross-chain transfer failed.';

          const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
          const _formattedAmount = xTransactionInput.inputAmount.toFixed(2);
          descriptionAction = `Transfer ${_tokenSymbol}`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xTransactionInput.type === XTransactionType.SWAP) {
          const { executionTrade } = xTransactionInput;
          if (executionTrade) {
            const swapMessages = swapMessage(
              executionTrade.inputAmount.toFixed(2),
              executionTrade.inputAmount.currency.symbol || 'IN',
              executionTrade.outputAmount.toFixed(2),
              executionTrade.outputAmount.currency.symbol || 'OUT',
            );

            pendingMessage = swapMessages.pendingMessage;
            successMessage = swapMessages.successMessage;
            errorMessage = 'Cross-chain swap failed.';

            const _inputTokenSymbol = executionTrade?.inputAmount.currency.symbol || '';
            const _outputTokenSymbol = executionTrade?.outputAmount.currency.symbol || '';
            const _inputAmount = executionTrade?.inputAmount.toFixed(2);
            const _outputAmount = executionTrade?.outputAmount.toFixed(2);
            descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
            descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
          }
        }

        xTransactionInput?.cleanupSwap?.();

        const sourceTransaction = transactionActions.add(sourceChainId, {
          hash: sourceTransactionHash,
          pendingMessage,
          successMessage,
          errorMessage,
        });

        if (sourceTransaction && sourceTransaction.hash) {
          const destinationChainInitialBlockHeight = (await primaryDstChainXCallService.getBlockHeight()) - 1n;

          const xMessage: XMessage = {
            id: `${sourceChainId}/${sourceTransaction.hash}`,
            sourceChainId: sourceChainId,
            destinationChainId: primaryDestinationChainId,
            sourceTransaction,
            status: XMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight,
          };

          xMessageActions.add(xMessage);

          const xTransaction: XTransaction = {
            id: xMessage.id,
            type: xTransactionInput.type,
            status: XTransactionStatus.pending,
            primaryMessageId: xMessage.id,
            secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
            sourceChainId: sourceChainId,
            desctinationChainId: finalDestinationChainId,
            attributes: {
              descriptionAction,
              descriptionAmount,
            },
          };

          set(state => {
            state.transactions[xTransaction.id] = xTransaction;
            state.currentId = xTransaction.id;
          });
        }
      },

      createSecondaryMessage: async (xTransaction: XTransaction, primaryMessage: XMessage) => {
        if (!primaryMessage.destinationTransaction) {
          throw new Error('destinationTransaction is not found'); // it should not happen
        }

        const sourceChainId = primaryMessage.destinationChainId;
        const destinationChainId = xTransaction.desctinationChainId;

        const sourceTransaction = primaryMessage.destinationTransaction;

        const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);
        const destinationChainInitialBlockHeight = (await dstChainXCallService.getBlockHeight()) - 20n;

        const secondaryMessageId = `${sourceChainId}/${sourceTransaction?.hash}`;
        const secondaryMessage: XMessage = {
          id: secondaryMessageId,
          sourceChainId,
          destinationChainId,
          sourceTransaction: sourceTransaction,
          status: XMessageStatus.REQUESTED,
          events: {},
          destinationChainInitialBlockHeight,
        };

        xMessageActions.add(secondaryMessage);

        set(state => {
          state.transactions[xTransaction.id].secondaryMessageId = secondaryMessageId;
        });
      },

      reset: () => {
        set(state => {
          state.currentId = null;
        });
      },

      success: (id: string) => {
        if (id === get().currentId) {
          const currentXTransaction = get().transactions[id];
          if (currentXTransaction.type === XTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXTransaction.type === XTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
          }
        }

        set(state => {
          state.transactions[id].status = XTransactionStatus.success;
          state.currentId = null;
        });
      },
      fail: (id: string) => {
        if (id === get().currentId) {
          const currentXTransaction = get().transactions[id];
          if (currentXTransaction.type === XTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXTransaction.type === XTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
          }
        }

        set(state => {
          state.transactions[id].status = XTransactionStatus.failure;
          state.currentId = null;
        });
      },

      onMessageUpdate: (id: string, xMessage: XMessage) => {
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

      getPendingTransactions: (signedWallets: { chain: XChain; chainId: XChainId; address: string }[]) => {
        return Object.values(get().transactions)
          .filter((transaction: XTransaction) => {
            return (
              transaction.status === XTransactionStatus.pending &&
              signedWallets.some(wallet => wallet.chainId === transaction.sourceChainId)
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
    })),
    {
      name: 'xTransaction-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
    },
  ),
);

export const xTransactionActions = {
  get: (id: string | null) => {
    return useXTransactionStore.getState().get(id);
  },

  // reserved for future use
  // add: (transaction: XTransaction) => {
  //   useXTransactionStore.getState().add(transaction);
  // },

  executeTransfer: (xTransactionInput: XTransactionInput & { cleanupSwap?: () => void }, onSuccess = () => {}) => {
    useXTransactionStore.getState().executeTransfer(xTransactionInput, onSuccess);
  },

  reset: () => {
    useXTransactionStore.getState().reset();
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

  getPendingTransactions: (signedWallets: { chain: XChain; chainId: XChainId; address: string }[]) => {
    return useXTransactionStore.getState().getPendingTransactions(signedWallets);
  },

  getByMessageId: (messageId: string) => {
    const transactions = useXTransactionStore.getState().transactions;
    return Object.values(transactions).find(
      transaction => transaction.primaryMessageId === messageId || transaction.secondaryMessageId === messageId,
    );
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
