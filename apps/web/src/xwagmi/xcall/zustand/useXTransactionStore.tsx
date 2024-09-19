import React from 'react';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { XChainId } from '@/xwagmi/types';
import { XMessage, XTransaction, XTransactionStatus } from '../types';
import { xMessageActions } from './useXMessageStore';

type XTransactionStore = {
  transactions: Record<string, XTransaction>;
  get: (id: string | null) => XTransaction | undefined;
  add: (transaction: XTransaction) => void;
  success: (id) => void;
  fail: (id) => void;
  getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => XTransaction[];
  remove: (id: string) => void;
};

const jsonStorageOptions = {
  reviver: (key, value: any) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else {
      return value;
    }
  },
};

export const useXTransactionStore = create<XTransactionStore>()(
  persist(
    immer((set, get) => ({
      transactions: {},

      get: (id: string | null) => {
        if (id) return get().transactions[id];
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

      getPendingTransactions: (signedWallets: { xChainId: XChainId | undefined; address: string }[]) => {
        return Object.values(get().transactions)
          .filter((transaction: XTransaction) => {
            return (
              transaction.status !== XTransactionStatus.success &&
              signedWallets.some(wallet => wallet.xChainId === transaction.sourceChainId)
            );
          })
          .sort((a: XTransaction, b: XTransaction) => {
            const aPrimaryMessage = xMessageActions.getOf(a.id, true);
            const bPrimaryMessage = xMessageActions.getOf(b.id, true);
            if (aPrimaryMessage && bPrimaryMessage) {
              return bPrimaryMessage?.sourceTransaction.timestamp - aPrimaryMessage?.sourceTransaction.timestamp;
            }
            return 0;
          });
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
