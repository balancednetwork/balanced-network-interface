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
  executeTransfer: (xSwapInfo: XSwapInfo & { cleanupSwap?: () => void }, onSuccess?: () => void) => void;
  createSecondaryMessage: (xCallTransaction: XCallTransaction, primaryMessage: XCallMessage) => void;
  reset: () => void;
  success: (id) => void;
  fail: (id) => void;
  onMessageUpdate: (id: string, xCallMessage: XCallMessage) => void;
  getPendingTransactions: (
    signedWallets: { chain: XChain; chainId: XChainId; address: string }[],
  ) => XCallTransaction[];
};

const iconChainId: XChainId = '0x1.icon';

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

      executeTransfer: async (xSwapInfo: XSwapInfo & { cleanupSwap?: () => void }, onSuccess = () => {}) => {
        const { direction } = xSwapInfo;
        const sourceChainId = direction.from;
        const finalDestinationChainId = direction.to;
        const primaryDestinationChainId = sourceChainId === iconChainId ? finalDestinationChainId : iconChainId;

        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        const finalDstChainXCallService = xCallServiceActions.getXCallService(finalDestinationChainId);
        const primaryDstChainXCallService = xCallServiceActions.getXCallService(primaryDestinationChainId);

        console.log('xSwapInfo', xSwapInfo);

        let sourceTransactionHash;
        if (xSwapInfo.type === XCallTransactionType.BRIDGE) {
          sourceTransactionHash = await srcChainXCallService.executeTransfer(xSwapInfo);
        } else if (xSwapInfo.type === XCallTransactionType.SWAP) {
          sourceTransactionHash = await srcChainXCallService.executeSwap(xSwapInfo);
        } else {
          throw new Error('Unsupported XCallTransactionType');
        }

        if (!sourceTransactionHash) {
          xCallTransactionActions.reset();
          return;
        }

        let pendingMessage, successMessage, errorMessage;
        let descriptionAction, descriptionAmount;
        if (xSwapInfo.type === XCallTransactionType.BRIDGE) {
          pendingMessage = 'Requesting cross-chain transfer...';
          successMessage = 'Cross-chain transfer requested.';
          errorMessage = 'Cross-chain transfer failed.';

          const _tokenSymbol = xSwapInfo.inputAmount.currency.symbol;
          const _formattedAmount = xSwapInfo.inputAmount.toFixed(2);
          descriptionAction = `Transfer ${_tokenSymbol}`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xSwapInfo.type === XCallTransactionType.SWAP) {
          const { executionTrade } = xSwapInfo;
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

        xSwapInfo?.cleanupSwap?.();

        const sourceTransaction = transactionActions.add(sourceChainId, {
          hash: sourceTransactionHash,
          pendingMessage,
          successMessage,
          errorMessage,
        });

        if (sourceTransaction && sourceTransaction.hash) {
          const destinationChainInitialBlockHeight = (await primaryDstChainXCallService.getBlockHeight()) - 1n;

          const xCallMessage: XCallMessage = {
            id: `${sourceChainId}/${sourceTransaction.hash}`,
            sourceChainId: sourceChainId,
            destinationChainId: primaryDestinationChainId,
            sourceTransaction,
            status: XCallMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight,
          };

          xCallMessageActions.add(xCallMessage);

          const xCallTransaction: XCallTransaction = {
            id: xCallMessage.id,
            type: xSwapInfo.type,
            status: XCallTransactionStatus.pending,
            primaryMessageId: xCallMessage.id,
            secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
            sourceChainId: sourceChainId,
            desctinationChainId: finalDestinationChainId,
            attributes: {
              descriptionAction,
              descriptionAmount,
            },
          };

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
        const destinationChainId = xCallTransaction.desctinationChainId;

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
          if (currentXCallTransaction.type === XCallTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXCallTransaction.type === XCallTransactionType.BRIDGE) {
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
          if (currentXCallTransaction.type === XCallTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
          }
          if (currentXCallTransaction.type === XCallTransactionType.BRIDGE) {
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
        return Object.values(get().transactions)
          .filter((transaction: XCallTransaction) => {
            return (
              transaction.status === XCallTransactionStatus.pending &&
              signedWallets.some(wallet => wallet.chainId === transaction.sourceChainId)
            );
          })
          .sort((a, b) => {
            const aPrimaryMessage = xCallMessageActions.get(a.primaryMessageId);
            const bPrimaryMessage = xCallMessageActions.get(b.primaryMessageId);
            if (aPrimaryMessage && bPrimaryMessage) {
              return bPrimaryMessage?.sourceTransaction.timestamp - aPrimaryMessage?.sourceTransaction.timestamp;
            }
            return 0;
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

  executeTransfer: (xSwapInfo: XSwapInfo & { cleanupSwap?: () => void }, onSuccess = () => {}) => {
    useXCallTransactionStore.getState().executeTransfer(xSwapInfo, onSuccess);
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
