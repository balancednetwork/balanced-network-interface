import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { XChainId } from '@/types';
import { jsonStorageOptions } from '@/utils';
import { XTransaction, XTransactionStatus } from '../types';

type XTransactionStore = {
  transactions: Record<string, XTransaction>;
  get: (id: string | null) => XTransaction | undefined;
  add: (transaction: XTransaction) => void;
  success: (id: string) => void;
  fail: (id: string) => void;
  getTransactions: () => XTransaction[];
  getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => XTransaction[];
  remove: (id: string) => void;
};

export const useXTransactionStore = create<XTransactionStore>()(
  persist(
    immer((set, get) => ({
      transactions: {},

      get: (id: string | null) => {
        if (id) return get().transactions[id];
        return undefined;
      },

      add: (transaction: XTransaction) => {
        set(state => {
          state.transactions[transaction.id] = transaction;
        });
      },

      success: (id: string) => {
        set(state => {
          state.transactions[id].status = XTransactionStatus.success;
        });
      },
      fail: (id: string) => {
        set(state => {
          state.transactions[id].status = XTransactionStatus.failure;
        });
      },

      getTransactions: () => {
        return Object.values(get().transactions).sort((a: XTransaction, b: XTransaction) => b.createdAt - a.createdAt);
      },

      getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => {
        return Object.values(get().transactions)
          .filter((transaction: XTransaction) => {
            return (
              transaction.status !== XTransactionStatus.success &&
              signedWallets.some(wallet => wallet.xChainId === transaction.sourceChainId)
            );
          })
          .sort((a: XTransaction, b: XTransaction) => b.createdAt - a.createdAt);
      },
      remove: (id: string) => {
        set(state => {
          delete state.transactions[id];
        });
      },
    })),
    {
      name: 'xTransaction-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
      version: 1,
      migrate: (state, version) => {
        return { transactions: {}, currentId: null };
      },
    },
  ),
);

export const xTransactionActions = {
  add: (transaction: XTransaction) => {
    useXTransactionStore.getState().add(transaction);
  },

  get: (id: string | null) => {
    return useXTransactionStore.getState().get(id);
  },

  success: (id: string) => {
    useXTransactionStore.getState().success(id);
  },

  fail: (id: string) => {
    useXTransactionStore.getState().fail(id);
  },

  remove: (id: string) => {
    useXTransactionStore.getState().remove(id);
  },
};
