// @ts-nocheck
import React from 'react';
import { create } from 'zustand';
import { t } from '@lingui/macro';
import { toast } from 'react-toastify';
import { useQuery, useQueries } from '@tanstack/react-query';

import { useIconReact } from 'packages/icon-react';
import { Converter } from 'icon-sdk-js';

import {
  NotificationPending,
  NotificationSuccess,
  NotificationError,
} from 'app/components/Notification/TransactionNotification';

//TODO: this is mock function, need to be replaced with real function
const getChainType = chainId => {
  switch (chainId) {
    case '0x1.icon':
      return 'icon';
    case '0x2.icon':
      return 'icon';
    default:
      return 'unknown';
  }
};

export enum TransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export const useTransactionStore = create(set => ({
  transactions: [],
}));

const getTrackerLink = (chainId, hash, type) => {
  // TODO: handle different chain types
  return `https://tracker.icon.foundation/transaction/${hash}?network=${chainId}`;
};

export const transactionActions = {
  add: (chainId, transaction) => {
    const newItem = { ...transaction, status: TransactionStatus.pending, chainId };
    useTransactionStore.setState(state => {
      return { transactions: [...state.transactions, newItem] };
    });

    const { hash } = transaction;
    const link = getTrackerLink(chainId, hash, 'transaction');
    const toastProps = {
      onClick: () => window.open(link, '_blank'),
    };

    toast(<NotificationPending summary={transaction.pendingMessage || t`Processing transaction...`} />, {
      ...toastProps,
      toastId: hash,
    });

    return newItem;
  },

  update: (chainId, hash, transaction) => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.map(item => {
          if (item.hash === hash && item.chainId === chainId) {
            return { ...item, ...transaction };
          }
          return item;
        }),
      };
    });
  },

  success: (chainId, hash, transaction) => {
    transactionActions.update(chainId, hash, { ...transaction, status: TransactionStatus.success });

    const transactions = useTransactionStore.getState().transactions;
    const _transaction = transactions.find(item => item.hash === hash && item.chainId === chainId);
    const toastProps = {
      onClick: () => window.open(getTrackerLink(chainId, hash, 'transaction'), '_blank'),
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
  },
  fail: (chainId, hash, transaction) => {
    transactionActions.update(chainId, hash, { ...transaction, status: TransactionStatus.failure });

    const transactions = useTransactionStore.getState().transactions;
    const _transaction = transactions.find(item => item.hash === hash && item.chainId === chainId);
    const toastProps = {
      onClick: () => window.open(getTrackerLink(chainId, hash, 'transaction'), '_blank'),
    };
    toast.update(_transaction.txHash, {
      ...toastProps,
      render: <NotificationError failureReason={(_transaction?.failure as any)?.message} />,
      autoClose: 5000,
    });
  },

  remove: (chainId, hash) => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.filter(item => !(item.hash === hash && item.chainId === chainId)),
      };
    });
  },
  removeAll: chainId => {
    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.filter(item => item.chainId !== chainId),
      };
    });
  },

  getTransactionsByChainType: chainType => {
    return useTransactionStore.getState().transactions.filter(item => getChainType(item.chainId) === chainType);
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
        queryKey: ['transaction', transaction.chainId, hash],
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
              transactionActions.success(transaction.chainId, hash, { receipt });
            } else {
              transactionActions.fail(transaction.chainId, hash, { receipt });
            }

            return txResult;
          } catch (err) {
            console.error(`failed to check transaction hash: ${hash}`, error);
            throw new Error(err.message);
          }
        },

        refetchInterval: 2000,
      };
    });

  useQueries({ queries });

  return null;
};

/*
hash
chainId
status
receipt
redirectOnSuccess - ?
pendingMessage
successMessage
errorMessage - ?
*/
