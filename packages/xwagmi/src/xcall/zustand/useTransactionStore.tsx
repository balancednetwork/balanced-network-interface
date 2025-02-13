import React, { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { create } from 'zustand';

import { getXPublicClient } from '@/actions';
// import {
//   NotificationError,
//   NotificationPending,
//   NotificationSuccess,
// } from '@/app/components/Notification/TransactionNotification';
import { XChainId } from '@/types';
import { getTrackerLink } from '@/utils';
import { Transaction, TransactionStatus, XTransactionType } from '@/xcall/types';
import { persist } from 'zustand/middleware';
import { xTransactionActions } from './useXTransactionStore';

type TransactionStore = {
  transactions: Transaction[];
};

export const useTransactionStore = create<TransactionStore>()(
  persist(
    set => ({
      transactions: [],
    }),
    {
      name: 'transaction-store',
    },
  ),
);

export const NotificationPending = ({ summary }) => <div>{summary}</div>;
export const NotificationSuccess = ({ summary, redirectOnSuccess }) => <div>{summary}</div>;
export const NotificationError = ({ failureReason }) => <div>{failureReason}</div>;

export const transactionActions = {
  get: (hash: string) => {
    return useTransactionStore.getState().transactions.find(transaction => transaction.hash === hash);
  },
  add: (
    xChainId: XChainId,
    transaction: {
      hash: string;
      pendingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: () => void;
    },
  ): Transaction => {
    const { hash } = transaction;
    const newItem = { ...transaction, status: TransactionStatus.pending, xChainId, id: hash, timestamp: Date.now() };
    useTransactionStore.setState(state => {
      return { transactions: [...state.transactions, newItem] };
    });

    const link = getTrackerLink(xChainId, hash, 'transaction');
    const toastProps = {
      onClick: () => window.open(link, '_blank'),
    };

    transaction.pendingMessage &&
      toast(<NotificationPending summary={transaction.pendingMessage || `Processing transaction...`} />, {
        ...toastProps,
        toastId: hash,
      });

    return newItem;
  },

  updateTx: async (xChainId: XChainId, id: string, transaction: { rawTx: any }) => {
    const { rawTx } = transaction;
    const xPublicClient = getXPublicClient(xChainId);
    const status = xPublicClient.deriveTxStatus(rawTx);

    useTransactionStore.setState(state => {
      return {
        transactions: state.transactions.map((transaction: Transaction) => {
          if (transaction.id === id) {
            const newTransaction: Transaction = {
              ...transaction,
              rawEventLogs: xPublicClient.getTxEventLogs(rawTx),
              status,
            };
            return newTransaction;
          }
          return transaction;
        }),
      };
    });

    const transactions = useTransactionStore.getState().transactions;
    const _transaction = transactions.find(item => item.id === id && item.xChainId === xChainId);
    if (_transaction) {
      if (status === TransactionStatus.success) {
        const xTransaction = xTransactionActions.get(`${xChainId}/${_transaction.hash}`);
        if (xTransaction?.type === XTransactionType.SWAP_ON_ICON) {
          xTransactionActions.success(xTransaction.id);
        }
        const toastProps = {
          onClick: () => window.open(getTrackerLink(xChainId, _transaction.hash, 'transaction'), '_blank'),
        };
        _transaction?.successMessage &&
          toast.update(_transaction.id, {
            ...toastProps,
            render: (
              <NotificationSuccess
                summary={_transaction?.successMessage}
                redirectOnSuccess={_transaction?.redirectOnSuccess}
              />
            ),
            autoClose: 5000,
          });

        _transaction.onSuccess?.();
      }

      if (status === TransactionStatus.failure) {
        const xTransaction = xTransactionActions.get(`${xChainId}/${_transaction.hash}`);
        if (xTransaction?.type === XTransactionType.SWAP_ON_ICON) {
          xTransactionActions.fail(xTransaction.id);
        }

        const toastProps = {
          onClick: () => window.open(getTrackerLink(xChainId, _transaction.hash, 'transaction'), '_blank'),
        };
        _transaction.errorMessage &&
          toast.update(_transaction.id, {
            ...toastProps,
            render: <NotificationError failureReason={_transaction.errorMessage} />, // TODO: handle error message
            autoClose: 5000,
          });
      }
    }
    return _transaction;
  },
};

export const useFetchTransaction = (hash: string) => {
  const transaction = useTransactionStore(state => state.transactions.find(item => item.hash === hash));

  const { xChainId, status } = transaction || {};
  const { data: rawTx, isLoading } = useQuery({
    queryKey: ['transaction', xChainId, hash],
    queryFn: async () => {
      if (!xChainId) return;

      const xPublicClient = getXPublicClient(xChainId);
      try {
        const rawTx = await xPublicClient.getTxReceipt(hash);
        return rawTx || null;
      } catch (err: any) {
        console.error(`failed to check transaction hash: ${hash}`, err);
        throw new Error(err?.message);
      }
    },
    refetchInterval: 2000,
    enabled: Boolean(status === TransactionStatus.pending && hash && xChainId),
  });

  return { rawTx, isLoading };
};

export const TransactionUpdater = ({ transaction }: { transaction: Transaction }) => {
  const { rawTx } = useFetchTransaction(transaction.hash);
  const { xChainId, id } = transaction;

  useEffect(() => {
    if (rawTx) {
      transactionActions.updateTx(xChainId, id, { rawTx });
    }
  }, [xChainId, id, rawTx]);

  return null;
};

export const AllTransactionsUpdater = () => {
  const { transactions } = useTransactionStore();

  return transactions
    .filter(({ status, hash }) => status === TransactionStatus.pending && !!hash)
    .map(transaction => <TransactionUpdater key={transaction.id} transaction={transaction} />);
};
