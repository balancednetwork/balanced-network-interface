import React from 'react';
import { create } from 'zustand';
import { t } from '@lingui/macro';
import { toast } from 'react-toastify';
import { useQueries } from '@tanstack/react-query';

import { useIconReact } from 'packages/icon-react';
import { Converter } from 'icon-sdk-js';

import {
  NotificationPending,
  NotificationSuccess,
  NotificationError,
} from 'app/components/Notification/TransactionNotification';
import { Transaction, TransactionStatus } from './types';

//TODO: this is mock function, need to be replaced with real function
const getChainType = xChainId => {
  switch (xChainId) {
    case '0x1.icon':
      return 'icon';
    case '0x2.icon':
      return 'icon';
    default:
      return 'unknown';
  }
};

type TransactionStore = {
  transactions: Transaction[];
};

export const useTransactionStore = create<TransactionStore>(set => ({
  transactions: [],
}));

const getTrackerLink = (xChainId, hash, type) => {
  // TODO: handle different chain types
  return `https://tracker.icon.foundation/transaction/${hash}?network=${xChainId}`;
};

export const transactionActions = {
  add: (xChainId, transaction) => {
    const newItem = { ...transaction, status: TransactionStatus.pending, xChainId };
    useTransactionStore.setState(state => {
      return { transactions: [...state.transactions, newItem] };
    });

    const { hash } = transaction;
    const link = getTrackerLink(xChainId, hash, 'transaction');
    const toastProps = {
      onClick: () => window.open(link, '_blank'),
    };

    toast(<NotificationPending summary={transaction.pendingMessage || t`Processing transaction...`} />, {
      ...toastProps,
      toastId: hash,
    });

    return newItem;
  },

  update: (xChainId, hash, transaction) => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.map(item => {
          if (item.hash === hash && item.xChainId === xChainId) {
            return { ...item, ...transaction };
          }
          return item;
        }),
      };
    });
  },

  success: (xChainId, hash, transaction) => {
    transactionActions.update(xChainId, hash, { ...transaction, status: TransactionStatus.success });

    const transactions = useTransactionStore.getState().transactions;
    const _transaction = transactions.find(item => item.hash === hash && item.xChainId === xChainId);
    if (_transaction) {
      const toastProps = {
        onClick: () => window.open(getTrackerLink(xChainId, hash, 'transaction'), '_blank'),
      };
      toast.update(_transaction.hash, {
        ...toastProps,
        render: (
          <NotificationSuccess
            summary={_transaction?.successMessage}
            redirectOnSuccess={_transaction?.redirectOnSuccess}
          />
        ),
        autoClose: 5000,
      });
    }
  },
  fail: (xChainId, hash, transaction) => {
    transactionActions.update(xChainId, hash, { ...transaction, status: TransactionStatus.failure });

    const transactions = useTransactionStore.getState().transactions;
    const _transaction = transactions.find(item => item.hash === hash && item.xChainId === xChainId);
    if (_transaction) {
      const toastProps = {
        onClick: () => window.open(getTrackerLink(xChainId, hash, 'transaction'), '_blank'),
      };
      toast.update(_transaction.hash, {
        ...toastProps,
        render: <NotificationError failureReason={(_transaction?.failure as any)?.message} />,
        autoClose: 5000,
      });
    }
  },

  remove: (xChainId, hash) => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.filter(item => !(item.hash === hash && item.xChainId === xChainId)),
      };
    });
  },
  removeAll: xChainId => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.filter(item => item.xChainId !== xChainId),
      };
    });
  },

  getTransactionsByChainType: chainType => {
    return useTransactionStore.getState().transactions.filter(item => getChainType(item.xChainId) === chainType);
  },
};

export const useTransactions = () => {};

// hook for updating transactions status by fetching transaction status from the chain
export const useTransactionsUpdater = () => {
  const { networkId, iconService } = useIconReact();
  const { transactions } = useTransactionStore();
  const iconTransactions = transactionActions.getTransactionsByChainType('icon');
  // console.log('iconTransactions', iconTransactions);

  const queries = iconTransactions
    .filter(x => x.status === TransactionStatus.pending)
    .map(transaction => {
      const hash = transaction.hash;
      return {
        queryKey: ['transaction', transaction.xChainId, hash],
        queryFn: async () => {
          try {
            const txResult = await iconService.getTransactionResult(hash).execute();

            const receipt = {
              blockHash: txResult.blockHash,
              blockHeight: txResult.blockHeight,
              scoreAddress: txResult.scoreAddress,
              // from: receipt.from,
              status: Converter.toNumber(txResult.status),
              to: txResult.to,
              txHash: txResult.txHash,
              txIndex: txResult.txIndex,
              eventLogs: txResult.eventLogs,
            };

            if (receipt.status === 1) {
              transactionActions.success(transaction.xChainId, hash, { receipt });
            } else {
              transactionActions.fail(transaction.xChainId, hash, { receipt });
            }

            return txResult;
          } catch (err) {
            console.error(`failed to check transaction hash: ${hash}`, err);
            throw new Error(err.message);
          }
        },

        refetchInterval: 2000,
      };
    });

  useQueries({ queries });

  return null;
};
