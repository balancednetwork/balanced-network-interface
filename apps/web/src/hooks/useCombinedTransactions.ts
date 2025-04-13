import { MMTransaction, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import { XTransaction, useTransactionStore, useXTransactionStore } from '@balancednetwork/xwagmi';
import { useMemo } from 'react';

const isMMTransaction = (transaction: MMTransaction | XTransaction): transaction is MMTransaction => {
  return !!(transaction as MMTransaction).orderId;
};

const getTransactionTimestamp = (transaction: MMTransaction | XTransaction): number => {
  if (isMMTransaction(transaction)) {
    // For MM transactions, we'll use the current timestamp as a fallback
    return Date.now();
  }
  return transaction.createdAt ?? 0;
};

export const useCombinedTransactions = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());
  const mmTransactions = useMMTransactionStore(state => Object.values(state.transactions));
  const txses = useTransactionStore(state => state.transactions);

  console.log('txses', txses);

  const sortedTransactions = useMemo(
    () => [...xTransactions, ...mmTransactions].sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a)),
    [xTransactions, mmTransactions],
  );

  return {
    transactions: sortedTransactions,
    isMMTransaction,
  };
};
