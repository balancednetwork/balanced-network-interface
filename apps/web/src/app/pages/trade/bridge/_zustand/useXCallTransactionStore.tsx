import React from 'react';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { CurrencyAmount } from '@balancednetwork/sdk-core';

import {
  XCallMessageStatus,
  XCallMessage,
  XCallTransaction,
  XCallTransactionStatus,
  XSwapInfo,
  XCallTransactionType,
} from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { transactionActions } from './useTransactionStore';
import { XCallMessageUpdater, useXCallMessageStore, xCallMessageActions } from './useXCallMessageStore';
import { swapMessage } from '../../supply/_components/utils';
import { XChain, XChainId } from '../types';
import { MODAL_ID, modalActions } from './useModalStore';

type XCallTransactionStore = {
  transactions: Record<string, XCallTransaction>;
  currentId: string | null;
  get: (id: string | null) => XCallTransaction | undefined;
  // add: (transaction: XCallTransaction) => void;
  executeTransfer: (xSwapInfo: XSwapInfo, onSuccess?: () => void) => void;
  executeSwap: (xSwapInfo: XSwapInfo & { cleanupSwap: () => void }) => void;
  createSecondaryMessage: (xCallTransaction: XCallTransaction, primaryMessage: XCallMessage) => void;
  reset: () => void;
  success: (id) => void;
  fail: (id) => void;
  onMessageUpdate: (id: string, xCallMessage: XCallMessage) => void;
  getPendingTransactions: (
    signedWallets: { chain: XChain; chainId: XChainId; address: string }[],
  ) => XCallTransaction[];
};

const storage = createJSONStorage(() => localStorage, {
  reviver: (key, value: any) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    if (
      typeof value === 'object' &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('numerator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('denominator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('currency') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('decimalScale')
    ) {
      try {
        const obj = CurrencyAmount.fromFractionalAmount(value.currency, value.numerator, value.denominator);
        return obj;
      } catch (e) {
        console.log(e);
      }
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
});

export const useXCallTransactionStore = create<XCallTransactionStore>()(
  persist(
    immer((set, get) => ({
      transactions: {},
      currentId: null,

      get: (id: string | null) => {
        if (id) return get().transactions[id];
      },

      // reserved for future use
      // add: (transaction: XCallTransaction) => {
      //   set(state => {
      //     state.transactions[transaction.id] = transaction;
      //   });
      // },

      executeTransfer: async (xSwapInfo: XSwapInfo, onSuccess = () => {}) => {
        const { direction } = xSwapInfo;
        const sourceChainId = direction.from;
        const destinationChainId = direction.to;
        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

        console.log('xSwapInfo', xSwapInfo);

        const sourceTransactionHash = await srcChainXCallService.executeTransfer(xSwapInfo);

        if (!sourceTransactionHash) {
          xCallTransactionActions.reset();
          return;
        }

        const sourceTransaction = transactionActions.add(sourceChainId, {
          hash: sourceTransactionHash,
          pendingMessage: 'Requesting cross-chain transfer...',
          successMessage: 'Cross-chain transfer requested.',
          errorMessage: 'Cross-chain transfer failed.',
        });

        if (sourceTransaction && sourceTransaction.hash) {
          const destinationChainInitialBlockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;

          const xCallMessage: XCallMessage = {
            id: `${sourceChainId}/${sourceTransaction.hash}`,
            sourceChainId: sourceChainId,
            destinationChainId: destinationChainId,
            sourceTransaction,
            status: XCallMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight,
          };

          xCallMessageActions.add(xCallMessage);

          const xCallTransaction: XCallTransaction = {
            id: xCallMessage.id,
            primaryMessageId: xCallMessage.id,
            secondaryMessageRequired: false,
            xSwapInfo,
            status: XCallTransactionStatus.pending,
          };

          set(state => {
            state.transactions[xCallTransaction.id] = xCallTransaction;
            state.currentId = xCallTransaction.id;
          });
        }
      },

      executeSwap: async (xSwapInfo: XSwapInfo & { cleanupSwap: () => void }) => {
        const iconChainId: XChainId = '0x1.icon';
        const { direction, executionTrade, cleanupSwap } = xSwapInfo;
        const sourceChainId = direction.from;
        const destinationChainId = direction.to;
        const _destinationChainId = sourceChainId === iconChainId ? destinationChainId : iconChainId;

        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        const _dstChainXCallService = xCallServiceActions.getXCallService(_destinationChainId);

        const sourceTransactionHash = await srcChainXCallService.executeSwap(xSwapInfo);

        if (!sourceTransactionHash || !executionTrade) {
          xCallTransactionActions.reset();
          return;
        }

        const swapMessages = swapMessage(
          executionTrade.inputAmount.toFixed(2),
          executionTrade.inputAmount.currency.symbol || 'IN',
          executionTrade.outputAmount.toFixed(2),
          executionTrade.outputAmount.currency.symbol || 'OUT',
        );

        const sourceTransaction = transactionActions.add(sourceChainId, {
          hash: sourceTransactionHash,
          pendingMessage: swapMessages.pendingMessage,
          successMessage: swapMessages.successMessage,
          errorMessage: 'Cross-chain swap failed.',
        });
        cleanupSwap?.();

        if (sourceTransaction && sourceTransaction.hash) {
          const destinationChainInitialBlockHeight = (await _dstChainXCallService.getBlockHeight()) - 1n;

          const xCallMessage: XCallMessage = {
            id: `${sourceChainId}/${sourceTransaction.hash}`,
            sourceChainId: sourceChainId,
            destinationChainId: _destinationChainId,
            sourceTransaction,
            status: XCallMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight,
          };

          xCallMessageActions.add(xCallMessage);

          const xCallTransaction: XCallTransaction = {
            id: xCallMessage.id,
            status: XCallTransactionStatus.pending,
            primaryMessageId: xCallMessage.id,
            secondaryMessageRequired: destinationChainId !== _destinationChainId,
            xSwapInfo,
          };

          // TODO: set destinationChainInitialBlockHeight for secondary message?
          // if (xCallTransaction.secondaryMessageRequired) {
          //   const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);
          //   const destinationChainInitialBlockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;
          //   xCallTransaction.destinationChainInitialBlockHeight = destinationChainInitialBlockHeight;
          // }

          set(state => {
            state.transactions[xCallTransaction.id] = xCallTransaction;
            state.currentId = xCallTransaction.id;
          });
        }
      },

      createSecondaryMessage: async (xCallTransaction: XCallTransaction, primaryMessage: XCallMessage) => {
        if (!primaryMessage.destinationTransaction) {
          throw new Error('destinationTransaction is not found'); // it should not happen
        }

        const sourceChainId = primaryMessage.destinationChainId;
        const destinationChainId = xCallTransaction.xSwapInfo?.direction.to;
        const sourceTransaction = primaryMessage.destinationTransaction;

        const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);
        const destinationChainInitialBlockHeight = (await dstChainXCallService.getBlockHeight()) - 20n;

        const secondaryMessageId = `${sourceChainId}/${sourceTransaction?.hash}`;
        const secondaryMessage: XCallMessage = {
          id: secondaryMessageId,
          sourceChainId,
          destinationChainId,
          sourceTransaction: sourceTransaction,
          status: XCallMessageStatus.REQUESTED,
          events: {},
          destinationChainInitialBlockHeight,
        };

        xCallMessageActions.add(secondaryMessage);

        set(state => {
          state.transactions[xCallTransaction.id].secondaryMessageId = secondaryMessageId;
        });
      },

      reset: () => {
        set(state => {
          state.currentId = null;
        });
      },

      success: (id: string) => {
        if (id === get().currentId) {
          const currentXCallTransaction = get().transactions[id];
          if (currentXCallTransaction.xSwapInfo.type === XCallTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXCallTransaction.xSwapInfo.type === XCallTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
          }
        }

        set(state => {
          state.transactions[id].status = XCallTransactionStatus.success;
          state.currentId = null;
        });
      },
      fail: (id: string) => {
        if (id === get().currentId) {
          const currentXCallTransaction = get().transactions[id];
          if (currentXCallTransaction.xSwapInfo.type === XCallTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXCallTransaction.xSwapInfo.type === XCallTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
          }
        }

        set(state => {
          state.transactions[id].status = XCallTransactionStatus.failure;
          state.currentId = null;
        });
      },

      onMessageUpdate: (id: string, xCallMessage: XCallMessage) => {
        const xCallTransaction = get().transactions[id];
        if (!xCallTransaction) return;

        const isPrimary = xCallTransaction.primaryMessageId === xCallMessage.id;
        const isSecondary = xCallTransaction.secondaryMessageId === xCallMessage.id;

        if (isPrimary) {
          if (xCallMessage.status === XCallMessageStatus.CALL_EXECUTED) {
            if (xCallTransaction.secondaryMessageRequired) {
              get().createSecondaryMessage(xCallTransaction, xCallMessage);
            } else {
              get().success(id);
            }
          }

          if (xCallMessage.status === XCallMessageStatus.FAILED) {
            get().fail(id);
          }
        }

        if (isSecondary) {
          if (xCallMessage.status === XCallMessageStatus.CALL_EXECUTED) {
            get().success(id);
          }

          if (xCallMessage.status === XCallMessageStatus.FAILED) {
            get().fail(id);
          }
        }
      },

      getPendingTransactions: (signedWallets: { chain: XChain; chainId: XChainId; address: string }[]) => {
        // return Object.values(get().transactions);
        return Object.values(get().transactions).filter((transaction: XCallTransaction) => {
          return (
            transaction.status === XCallTransactionStatus.pending &&
            signedWallets.some(wallet => wallet.chainId === transaction.xSwapInfo.direction.from)
          );
        });
      },
    })),
    {
      name: 'xCallTransaction-store',
      storage,
    },
  ),
);

export const xCallTransactionActions = {
  get: (id: string | null) => {
    return useXCallTransactionStore.getState().get(id);
  },

  // reserved for future use
  // add: (transaction: XCallTransaction) => {
  //   useXCallTransactionStore.getState().add(transaction);
  // },

  executeTransfer: (xSwapInfo: XSwapInfo, onSuccess = () => {}) => {
    useXCallTransactionStore.getState().executeTransfer(xSwapInfo, onSuccess);
  },

  executeSwap: (xSwapInfo: XSwapInfo & { cleanupSwap: () => void }) => {
    useXCallTransactionStore.getState().executeSwap(xSwapInfo);
  },

  reset: () => {
    useXCallTransactionStore.getState().reset();
  },

  success: (id: string) => {
    useXCallTransactionStore.getState().success(id);
  },

  fail: (id: string) => {
    useXCallTransactionStore.getState().fail(id);
  },

  onMessageUpdate: (id: string, xCallMessage: XCallMessage) => {
    useXCallTransactionStore.getState().onMessageUpdate(id, xCallMessage);
  },

  getPendingTransactions: (signedWallets: { chain: XChain; chainId: XChainId; address: string }[]) => {
    return useXCallTransactionStore.getState().getPendingTransactions(signedWallets);
  },

  getByMessageId: (messageId: string) => {
    const transactions = useXCallTransactionStore.getState().transactions;
    return Object.values(transactions).find(
      transaction => transaction.primaryMessageId === messageId || transaction.secondaryMessageId === messageId,
    );
  },

  // sendXToken: async (xSwapInfo: XSwapInfo, onSuccess = () => {}) => {
  //   const { direction } = xSwapInfo;
  //   const sourceChainId = direction.from;
  //   const destinationChainId = direction.to;
  //   const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
  //   const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

  //   const sourceTransactionHash = await srcChainXCallService.executeTransfer(xSwapInfo);

  //   if (!sourceTransactionHash) {
  //     xSupplyActions.reset();
  //     return;
  //   }

  //   const sourceTransaction = transactionActions.add(sourceChainId, {
  //     hash: sourceTransactionHash,
  //     pendingMessage: 'Requesting cross-chain transfer...',
  //     successMessage: 'Cross-chain transfer requested.',
  //     errorMessage: 'Cross-chain transfer failed.',
  //   });

  //   if (sourceTransaction && sourceTransaction.hash) {
  //     const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;

  //     const transfer: XCallMessage = {
  //       id: `${sourceChainId}/${sourceTransaction.hash}`,
  //       sourceChainId: sourceChainId,
  //       destinationChainId: destinationChainId,
  //       sourceTransaction,
  //       xSwapInfo,
  //       status: XCallMessageStatus.REQUESTED,
  //       events: {},
  //       destinationChainInitialBlockHeight: blockHeight,
  //       childTransferNeeded: false,
  //       onSuccess: async transfer => {
  //         onSuccess();
  //         xSupplyActions.success(transfer);
  //       },
  //       onFail: async transfer => {
  //         xSupplyActions.fail(transfer);
  //       },
  //     };

  //     bridgeTransferHistoryActions.add(transfer);
  //     useXSupplyStore.setState({ transferId: transfer.id });
  //   }
  // },
};

export const XCallTransactionUpdater = ({ xCallTransaction }: { xCallTransaction: XCallTransaction }) => {
  useXCallMessageStore();
  const { primaryMessageId, secondaryMessageId } = xCallTransaction;

  const primaryMessage = xCallMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xCallMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XCallMessageUpdater xCallMessage={primaryMessage} />}
      {secondaryMessage && <XCallMessageUpdater xCallMessage={secondaryMessage} />}
    </>
  );
};
