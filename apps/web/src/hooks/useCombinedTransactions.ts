import { useOrderStore } from '@/store/order/useOrderStore';
import { Order } from '@/store/order/useOrderStore';
import { MMTransaction, MMTransactionStatus, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import { Transaction, XTransaction, XTransactionStatus, useXTransactionStore } from '@balancednetwork/xwagmi';
import { useMemo } from 'react';

export const UnifiedTransactionType = {
  order: 'order',
} as const;

export const UnifiedTransactionStatus = {
  pending: 'pending',
  success: 'success',
  failed: 'failed',
} as const;

type UnifiedTransactionType = keyof typeof UnifiedTransactionType;
export type UnifiedTransactionStatus = keyof typeof UnifiedTransactionStatus;

type UnifiedTransaction = {
  hash: string;
  timestamp: number;
  status: UnifiedTransactionStatus;
} & {
  type: typeof UnifiedTransactionType.order;
  data: Order;
};

export const useCombinedTransactions = (): UnifiedTransaction[] => {
  const { orders } = useOrderStore();

  const orderTransactions = useMemo(() => {
    return orders.map(order => {
      return {
        hash: order.intentHash,
        timestamp: order.timestamp,
        status: order.status,
        type: 'order',
        data: order,
      } as UnifiedTransaction;
    });
  }, [orders]);

  const sortedTransactions = useMemo(
    () => [...orderTransactions].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
    [orderTransactions],
  );

  return sortedTransactions;
};

export const useIsAnyTxPending = (): boolean => {
  const transactions = useCombinedTransactions();
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour in milliseconds

  return transactions.some(tx => {
    return true;

    // if (isMMTransaction(tx)) {
    //   return tx.status === MMTransactionStatus.pending;
    // } else {
    //   return tx.status === XTransactionStatus.pending;
    // }
  });
};
