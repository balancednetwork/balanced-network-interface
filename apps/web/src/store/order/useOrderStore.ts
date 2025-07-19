import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Hex, Intent, PacketData } from '@sodax/sdk';

export interface Order {
  intentHash: Hex;
  intent: Intent;
  packet: PacketData;
}

interface OrderStoreState {
  orders: Order[];
  addOrder: (order: Order) => void;
  removeOrder: (intentHash: Hex) => void;
}

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order: Order) => {
        const { orders } = get();
        set({ orders: [order, ...orders] });
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
