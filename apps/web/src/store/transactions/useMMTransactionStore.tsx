import { useMemo } from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken, jsonStorageOptions } from '@balancednetwork/xwagmi';
import { useQuery } from '@tanstack/react-query';
import { IntentStatusCode } from 'icon-intents-sdk';

import { intentService } from '@/lib/intent';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export enum MMTransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
  cancelled = 'cancelled',
}

export type MMTransaction = {
  id: string;
  executor: string;
  orderId: bigint;
  taskId: string;
  status: MMTransactionStatus;
  fromAmount: CurrencyAmount<XToken>;
  toAmount: CurrencyAmount<XToken>;
};

type MMTransactionStore = {
  transactions: Record<string, MMTransaction>;
  get: (id: string | null) => MMTransaction | undefined;
  add: (transaction: MMTransaction) => void;
  success: (id: string) => void;
  fail: (id: string) => void;
  cancel: (id: string) => void;
  setTaskId: (id: string, taskId: string) => void;
  setOrderId: (id: string, orderId: bigint) => void;
  getPendingTransactions: () => MMTransaction[];
  remove: (id: string) => void;
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

      cancel: (id: string) => {
        set(state => {
          state.transactions[id].status = MMTransactionStatus.cancelled;
        });
      },

      setTaskId: (id: string, taskId: string) => {
        set(state => {
          state.transactions[id].taskId = taskId;
        });
      },

      setOrderId: (id: string, orderId: bigint) => {
        set(state => {
          state.transactions[id].orderId = orderId;
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

  cancel: (id: string) => {
    useMMTransactionStore.getState().cancel(id);
  },

  setTaskId: (id: string, taskId: string) => {
    useMMTransactionStore.getState().setTaskId(id, taskId);
  },

  setOrderId: (id: string, orderId: bigint) => {
    useMMTransactionStore.getState().setOrderId(id, orderId);
  },

  remove: (id: string) => {
    useMMTransactionStore.getState().remove(id);
  },
};

// create an Updater component that will check the status of transactions
// and update the store accordingly
export const Updater = () => {
  const { transactions } = useMMTransactionStore();

  const pendingIntents = useMemo(() => {
    return Object.values(transactions).filter(tx => tx.status === MMTransactionStatus.pending);
  }, [transactions]);

  useQuery({
    queryKey: ['checkMMTransactions'],
    queryFn: async () => {
      return Promise.all(
        pendingIntents.map(async t => {
          const intentStatus = await intentService.getStatus({ task_id: t.taskId });

          if (intentStatus.ok && intentStatus.value.status === IntentStatusCode.SOLVED) {
            MMTransactionActions.success(t.id);
          }
        }),
      );
    },
    refetchInterval: 2_000,
    enabled: pendingIntents.length > 0,
  });

  return null;
};
