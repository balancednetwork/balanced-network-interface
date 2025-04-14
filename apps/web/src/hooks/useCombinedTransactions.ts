import { MMTransaction, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import { Transaction, XTransaction, useTransactionStore, useXTransactionStore } from '@balancednetwork/xwagmi';
import { useMemo } from 'react';

const isMMTransaction = (transaction: MMTransaction | XTransaction): transaction is MMTransaction => {
  return !!(transaction as MMTransaction).orderId;
};

const getTransactionTimestamp = (transaction: MMTransaction | XTransaction | Transaction): number => {
  if ('createdAt' in transaction) {
    return transaction.createdAt ?? 0;
  }
  if ('timestamp' in transaction) {
    return transaction.timestamp ?? 0;
  }
  return Date.now();
};

export const useCombinedTransactions = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());
  const mmTransactions = useMMTransactionStore(state => Object.values(state.transactions));
  const txses = useTransactionStore(state => state.transactions);

  const sortedTransactions = useMemo(
    () => [...xTransactions, ...mmTransactions].sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a)),
    [xTransactions, mmTransactions],
  );

  return {
    transactions: sortedTransactions,
    isMMTransaction,
  };
};
