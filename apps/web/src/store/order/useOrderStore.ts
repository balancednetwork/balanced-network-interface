import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { Hex, Intent, PacketData } from '@sodax/sdk';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Order {
  intentHash: Hex;
  intent: Intent;
  packet: PacketData;
  timestamp: number;
  status: UnifiedTransactionStatus;
}

interface OrderStoreState {
  orders: Order[];
  addOrder: (order: AddOrderDefaults) => void;
  removeOrder: (intentHash: Hex) => void;
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
    }),
    {
      name: 'balanced-orders',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
