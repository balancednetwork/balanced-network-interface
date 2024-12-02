import { IntentService, IntentStatusCode } from '@balancednetwork/intents-sdk';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export enum MMTransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export type MMTransaction = {
  id: string;
  status: MMTransactionStatus;
};

type MMTransactionStore = {
  transactions: Record<string, MMTransaction>;
  get: (id: string | null) => MMTransaction | undefined;
  add: (transaction: MMTransaction) => void;
  success: (id: string) => void;
  fail: (id: string) => void;
  getPendingTransactions: () => MMTransaction[];
  remove: (id: string) => void;
};

const jsonStorageOptions = {
  reviver: (_key: unknown, value: unknown) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    return value;
  },
  replacer: (_key: unknown, value: unknown) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else {
      return value;
    }
  },
};

export const useMMTransactionStore = create<MMTransactionStore>()(
  persist(
    immer((set, get) => ({
      transactions: {},

      get: (id: string | null) => {
        if (id) return get().transactions[id];
      },

      add: (transaction: MMTransaction) => {
        set(state => {
          state.transactions[transaction.id] = transaction;
        });
      },

      success: (id: string) => {
        set(state => {
          state.transactions[id].status = MMTransactionStatus.success;
        });
      },

      fail: (id: string) => {
        set(state => {
          state.transactions[id].status = MMTransactionStatus.failure;
        });
      },

      getPendingTransactions: () => {
        return Object.values(get().transactions).filter((transaction: MMTransaction) => {
          return (
            transaction.status !== MMTransactionStatus.success
            // signedWallets.some(wallet => wallet.xChainId === transaction.sourceChainId)
          );
        });
        // .sort((a: MMTransaction, b: MMTransaction) => {
        //   const aPrimaryMessage = xMessageActions.getOf(a.id, true);
        //   const bPrimaryMessage = xMessageActions.getOf(b.id, true);
        //   if (aPrimaryMessage && bPrimaryMessage) {
        //     return bPrimaryMessage.createdAt - aPrimaryMessage.createdAt;
        //   }
        //   return 0;
        // });
      },
      remove: (id: string) => {
        set(state => {
          delete state.transactions[id];
        });
      },
    })),
    {
      name: 'MMTransaction-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
      version: 1,
      migrate: (state, version) => {
        return { transactions: {}, currentId: null };
      },
    },
  ),
);

export const MMTransactionActions = {
  add: (transaction: MMTransaction) => {
    useMMTransactionStore.getState().add(transaction);
  },

  get: (id: string | null) => {
    return useMMTransactionStore.getState().get(id);
  },

  success: (id: string) => {
    useMMTransactionStore.getState().success(id);
  },

  fail: (id: string) => {
    useMMTransactionStore.getState().fail(id);
  },

  remove: (id: string) => {
    useMMTransactionStore.getState().remove(id);
  },
};

// create an Updater component that will check the status of transactions
// and update the store accordingly
export const Updater = () => {
  const { transactions } = useMMTransactionStore();

  const pendingTxs = useMemo(() => {
    return Object.keys(transactions).filter(id => transactions[id].status === MMTransactionStatus.pending);
  }, [transactions]);

  useQuery({
    queryKey: ['checkMMTransactions'],
    queryFn: async () => {
      return Promise.all(
        pendingTxs.map(async id => {
          const intentStatus = await IntentService.getStatus({ task_id: id });

          if (intentStatus.ok && intentStatus.value.status === IntentStatusCode.SOLVED) {
            MMTransactionActions.success(id);
          }
        }),
      );
    },
    refetchInterval: 5_000,
    enabled: pendingTxs.length > 0,
  });

  return null;
};
