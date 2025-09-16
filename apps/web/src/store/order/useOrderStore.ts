import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { Hex, Intent, IntentDeliveryInfo } from '@sodax/sdk';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Order {
  intentHash: Hex;
  intent: Intent;
  packet: IntentDeliveryInfo;
  timestamp: number;
  status: UnifiedTransactionStatus;
}

interface OrderStoreState {
  orders: Order[];
  addOrder: (order: AddOrderDefaults) => void;
  removeOrder: (intentHash: Hex) => void;
  updateOrderStatus: (intentHash: Hex, status: UnifiedTransactionStatus) => void;
  updateOrderDstTxHash: (intentHash: Hex, dstTxHash: Hex) => void;
}

type AddOrderDefaults = Omit<Order, 'timestamp' | 'status'>;

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order: AddOrderDefaults) => {
        const { orders } = get();
        set({ orders: [{ ...order, status: UnifiedTransactionStatus.pending, timestamp: Date.now() }, ...orders] });
      },
      removeOrder: (intentHash: Hex) => {
        const { orders } = get();
        set({ orders: orders.filter(o => o.intentHash !== intentHash) });
      },
      updateOrderStatus: (intentHash: Hex, status: UnifiedTransactionStatus) => {
        const { orders } = get();
        set({
          orders: orders.map(order => (order.intentHash === intentHash ? { ...order, status } : order)),
        });
      },
      updateOrderDstTxHash: (intentHash: Hex, dstTxHash: Hex) => {
        const { orders } = get();
        set({
          orders: orders.map(order =>
            order.intentHash === intentHash
              ? {
                  ...order,
                  packet: {
                    ...order.packet,
                    dstTxHash,
                  },
                }
              : order,
          ),
        });
      },
    }),
    {
      name: 'balanced-orders',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
