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

export type UnifiedTransaction = {
  hash: string;
  timestamp: number;
  status: UnifiedTransactionStatus;
} & {
  type: typeof UnifiedTransactionType.order;
  data: Order;
};

export const useCombinedTransactions = (): UnifiedTransaction[] => {
  const { orders } = useOrderStore();

  return useMemo(() => {
    const orderTransactions = orders.map(order => {
      return {
        hash: order.intentHash,
        timestamp: order.timestamp,
        status: order.status,
        type: 'order',
        data: order,
      } as UnifiedTransaction;
    });

    return orderTransactions.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [orders]);
};

export const useIsAnyTxPending = (): boolean => {
  const { orders } = useOrderStore();

  return useMemo(() => {
    return orders.some(order => order.status === UnifiedTransactionStatus.pending);
  }, [orders]);
};
