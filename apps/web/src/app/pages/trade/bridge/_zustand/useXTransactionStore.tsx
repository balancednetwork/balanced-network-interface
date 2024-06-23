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
import { xServiceActions } from './useXServiceStore';
import { transactionActions } from './useTransactionStore';
import { XMessageUpdater, useXMessageStore, xMessageActions } from './useXMessageStore';
import { swapMessage } from '../../supply/_components/utils';
import { XChain, XChainId } from '../types';
import { MODAL_ID, modalActions } from './useModalStore';
import { formatBigNumber } from 'utils';
import BigNumber from 'bignumber.js';

type XTransactionStore = {
  transactions: Record<string, XTransaction>;
  currentId: string | null;
  get: (id: string | null) => XTransaction | undefined;
  // add: (transaction: XTransaction) => void;
  executeTransfer: (xTransactionInput: XTransactionInput, onSuccess?: () => void) => void;
  createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => void;
  reset: () => void;
  success: (id) => void;
  fail: (id) => void;
  onMessageUpdate: (id: string, xMessage: XMessage) => void;
  getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => XTransaction[];
  remove: (id: string) => void;
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

      executeTransfer: async (xTransactionInput: XTransactionInput, onSuccess = () => {}) => {
        const { direction } = xTransactionInput;
        const sourceChainId = direction.from;
        const finalDestinationChainId = direction.to;
        const primaryDestinationChainId = sourceChainId === iconChainId ? finalDestinationChainId : iconChainId;

        const srcChainXService = xServiceActions.getWalletXService(sourceChainId);

        if (!srcChainXService) {
          throw new Error('WalletXService for source chain is not found');
        }

        console.log('xTransactionInput', xTransactionInput);

        let sourceTransactionHash;
        if (xTransactionInput.type === XTransactionType.BRIDGE) {
          sourceTransactionHash = await srcChainXService.executeTransfer(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.SWAP) {
          sourceTransactionHash = await srcChainXService.executeSwap(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.DEPOSIT_COLLATERAL) {
          sourceTransactionHash = await srcChainXService.executeDepositCollateral(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.WITHDRAW_COLLATERAL) {
          sourceTransactionHash = await srcChainXService.executeWithdrawCollateral(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.BORROW) {
          sourceTransactionHash = await srcChainXService.executeBorrow(xTransactionInput);
        } else if (xTransactionInput.type === XTransactionType.REPAY) {
          sourceTransactionHash = await srcChainXService.executeRepay(xTransactionInput);
        } else {
          throw new Error('Unsupported XTransactionType');
        }

        const primaryDestinationChainInitialBlockHeight =
          xServiceActions.getXChainHeight(primaryDestinationChainId) - 5n;
        const finalDestinationChainInitialBlockHeight = xServiceActions.getXChainHeight(finalDestinationChainId);

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
          const _formattedAmount = formatBigNumber(
            new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
            'currency',
          );
          descriptionAction = `Transfer ${_tokenSymbol}`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xTransactionInput.type === XTransactionType.SWAP) {
          const { executionTrade } = xTransactionInput;
          if (executionTrade) {
            const _inputTokenSymbol = executionTrade?.inputAmount.currency.symbol || '';
            const _outputTokenSymbol = executionTrade?.outputAmount.currency.symbol || '';
            const _inputAmount = formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency');
            const _outputAmount = formatBigNumber(
              new BigNumber(executionTrade?.outputAmount.toFixed() || 0),
              'currency',
            );

            const swapMessages = swapMessage(
              _inputAmount,
              _inputTokenSymbol === '' ? 'IN' : _inputTokenSymbol,
              _outputAmount,
              _outputTokenSymbol === '' ? 'OUT' : _outputTokenSymbol,
            );

            pendingMessage = swapMessages.pendingMessage;
            successMessage = swapMessages.successMessage;
            errorMessage = 'Cross-chain swap failed.';
            descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
            descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
          }
        } else if (xTransactionInput.type === XTransactionType.DEPOSIT_COLLATERAL) {
          pendingMessage = 'Requesting collateral deposit...';
          successMessage = 'Collateral deposited.';
          errorMessage = 'Collateral deposit failed.';

          const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
          const _formattedAmount = xTransactionInput.inputAmount.toFixed(2);
          descriptionAction = `Deposit ${_tokenSymbol} as collateral`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xTransactionInput.type === XTransactionType.WITHDRAW_COLLATERAL) {
          //todo handle description for xCalls without input amount
          pendingMessage = 'Requesting collateral withdrawal...';
          successMessage = 'Collateral withdrawn.';
          errorMessage = 'Collateral withdrawal failed.';

          const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
          const _formattedAmount = xTransactionInput.inputAmount.toFixed(2);
          descriptionAction = `Withdraw ${_tokenSymbol} collateral`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xTransactionInput.type === XTransactionType.BORROW) {
          //todo handle description for xCalls without input amount
          pendingMessage = 'Requesting borrow...';
          successMessage = 'Borrowed successfully.';
          errorMessage = 'Borrow failed.';

          const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
          const _formattedAmount = xTransactionInput.inputAmount.toFixed(2);
          descriptionAction = `Borrow ${_tokenSymbol}`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        } else if (xTransactionInput.type === XTransactionType.REPAY) {
          pendingMessage = 'Requesting repay...';
          successMessage = 'Repaid successfully.';
          errorMessage = 'Repay failed.';

          const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
          const _formattedAmount = xTransactionInput.inputAmount.toFixed(2);
          descriptionAction = `Repay ${_tokenSymbol}`;
          descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
        }

        xTransactionInput?.callback?.();

        const sourceTransaction = transactionActions.add(sourceChainId, {
          hash: sourceTransactionHash,
          pendingMessage,
          successMessage,
          errorMessage,
        });

        if (sourceTransaction && sourceTransaction.hash) {
          const xMessage: XMessage = {
            id: `${sourceChainId}/${sourceTransaction.hash}`,
            sourceChainId: sourceChainId,
            destinationChainId: primaryDestinationChainId,
            sourceTransaction,
            status: XMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight: primaryDestinationChainInitialBlockHeight,
          };

          xMessageActions.add(xMessage);

          const xTransaction: XTransaction = {
            id: xMessage.id,
            type: xTransactionInput.type,
            status: XTransactionStatus.pending,
            primaryMessageId: xMessage.id,
            secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
            sourceChainId: sourceChainId,
            finalDestinationChainId: finalDestinationChainId,
            finalDestinationChainInitialBlockHeight,
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

      reset: () => {
        set(state => {
          state.currentId = null;
        });
      },

      success: (id: string) => {
        if (id === get().currentId) {
          const currentXTransaction = get().transactions[id];
          if (currentXTransaction.type === XTransactionType.SWAP) {
            modalActions.closeModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
          }
          if (currentXTransaction.type === XTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.XTRANSFER_CONFIRM_MODAL);
          }
          if (
            currentXTransaction.type === XTransactionType.DEPOSIT_COLLATERAL ||
            currentXTransaction.type === XTransactionType.WITHDRAW_COLLATERAL
          ) {
            modalActions.closeModal(MODAL_ID.XCOLLATERAL_CONFIRM_MODAL);
          }
          if (
            currentXTransaction.type === XTransactionType.BORROW ||
            currentXTransaction.type === XTransactionType.REPAY
          ) {
            modalActions.closeModal(MODAL_ID.XLOAN_CONFIRM_MODAL);
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
            modalActions.closeModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
          }
          if (currentXTransaction.type === XTransactionType.BRIDGE) {
            modalActions.closeModal(MODAL_ID.XTRANSFER_CONFIRM_MODAL);
          }
          if (
            currentXTransaction.type === XTransactionType.DEPOSIT_COLLATERAL ||
            currentXTransaction.type === XTransactionType.WITHDRAW_COLLATERAL
          ) {
            modalActions.closeModal(MODAL_ID.XCOLLATERAL_CONFIRM_MODAL);
          }
          if (
            currentXTransaction.type === XTransactionType.BORROW ||
            currentXTransaction.type === XTransactionType.REPAY
          ) {
            modalActions.closeModal(MODAL_ID.XLOAN_CONFIRM_MODAL);
          }
        }

        set(state => {
          state.transactions[id].status = XTransactionStatus.failure;
          state.currentId = null;
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

  // reserved for future use
  // add: (transaction: XTransaction) => {
  //   useXTransactionStore.getState().add(transaction);
  // },

  executeTransfer: (xTransactionInput: XTransactionInput, onSuccess = () => {}) => {
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
