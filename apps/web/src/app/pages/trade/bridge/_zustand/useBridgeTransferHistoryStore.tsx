import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

import { XCallEventType, XChain, XChainId } from '../types';
import { BridgeTransfer, BridgeTransferStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { useCreateXCallService, xCallServiceActions } from './useXCallServiceStore';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { useFetchTransaction } from './useTransactionStore';
import { useEffect } from 'react';
import { getNetworkDisplayName } from '../utils';

// TODO: review logic
export const deriveStatus = (
  sourceTransaction: Transaction,
  events: XCallEventMap,
  destinationTransaction: Transaction | undefined = undefined,
): BridgeTransferStatus => {
  if (!sourceTransaction) {
    return BridgeTransferStatus.TRANSFER_FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.pending) {
    return BridgeTransferStatus.TRANSFER_REQUESTED;
  }

  if (sourceTransaction.status === TransactionStatus.failure) {
    return BridgeTransferStatus.TRANSFER_FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.success) {
    if (events[XCallEventType.CallExecuted] && events[XCallEventType.CallExecuted].isSuccess) {
      if (destinationTransaction && destinationTransaction.status === TransactionStatus.success) {
        return BridgeTransferStatus.CALL_EXECUTED;
        // return BridgeTransferStatus.TRANSFER_COMPLETED;
      }

      // return BridgeTransferStatus.CALL_EXECUTED;
    }

    if (events[XCallEventType.CallMessage]) {
      return BridgeTransferStatus.CALL_MESSAGE;
    }

    if (events[XCallEventType.CallMessageSent]) {
      return BridgeTransferStatus.CALL_MESSAGE_SENT;
    }

    return BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT;
  }

  return BridgeTransferStatus.TRANSFER_FAILED;
};

const storage = createJSONStorage(() => localStorage, {
  reviver: (key, value: any) => {
    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    if (
      typeof value === 'object' &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('numerator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('denominator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('currency') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('decimalScale')
    ) {
      try {
        const obj = CurrencyAmount.fromFractionalAmount(value.currency, value.numerator, value.denominator);
        return obj;
      } catch (e) {
        console.log(e);
      }
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
});

type BridgeTransferHistoryStore = {
  transfers: Record<string, BridgeTransfer>;
  getTransfer: (id: string | null) => BridgeTransfer | undefined;
  addTransfer: (transfer: BridgeTransfer) => void;
  updateSourceTransaction: (id: string, { rawTx }: { rawTx: any }) => void;
  updateTransferEvents: (id: string, events: XCallEventMap) => Promise<void>;
  remove: (id: string) => void;
};

export const useBridgeTransferHistoryStore = create<BridgeTransferHistoryStore>()(
  // devtools(
  persist(
    immer((set, get) => ({
      transfers: {},
      getTransfer: (id: string | null) => {
        if (id) return get().transfers[id];
      },
      addTransfer: (transfer: BridgeTransfer) => {
        set(state => {
          state.transfers[transfer.id] = transfer;
        });
      },
      updateSourceTransaction: (id: string, { rawTx }) => {
        const transfer = get().transfers[id];
        if (!transfer) return;

        const xCallService = xCallServiceActions.getXCallService(transfer.sourceChainId);
        const newSourceTransactionStatus = xCallService.deriveTxStatus(rawTx);

        const newSourceTransaction = {
          ...transfer.sourceTransaction,
          rawEventLogs: xCallService.getTxEventLogs(rawTx),
          status: newSourceTransactionStatus,
        };
        const newStatus = deriveStatus(newSourceTransaction, transfer.events, transfer.destinationTransaction);

        set(state => {
          state.transfers[id] = {
            ...transfer,
            sourceTransaction: newSourceTransaction,
            status: newStatus,
          };
        });
      },
      updateTransferEvents: async (id: string, events: XCallEventMap) => {
        const transfer = get().transfers[id];
        if (!transfer) return;

        let destinationTransaction: Transaction | undefined = undefined;

        const oldStatus = transfer.status;

        const newEvents = {
          ...transfer.events,
          ...events,
        };

        if (newEvents[XCallEventType.CallExecuted]) {
          const dstXCallService = xCallServiceActions.getXCallService(transfer.destinationChainId);
          const destinationTransactionHash = newEvents[XCallEventType.CallExecuted].txHash;
          const rawTx = await dstXCallService.getTxReceipt(destinationTransactionHash);

          destinationTransaction = {
            id: destinationTransactionHash,
            hash: destinationTransactionHash,
            xChainId: transfer.destinationChainId,
            status: dstXCallService.deriveTxStatus(rawTx),
            rawEventLogs: dstXCallService.getTxEventLogs(rawTx),
            timestamp: Date.now(),
            // timestamp: newEvents[XCallEventType.CallExecuted].timestamp,
          };
        }
        const newStatus = deriveStatus(transfer.sourceTransaction, newEvents, destinationTransaction);

        const newTransfer = {
          ...transfer,
          events: newEvents,
          status: newStatus,
          destinationTransaction,
        };

        set(state => {
          state.transfers[id] = newTransfer;
        });

        if (newStatus !== oldStatus) {
          if (newStatus === BridgeTransferStatus.CALL_EXECUTED) {
            xCallEventActions.disableScanner(newTransfer.id);
            await transfer.onSuccess(newTransfer);
          } else if (newStatus === BridgeTransferStatus.TRANSFER_FAILED) {
            xCallEventActions.disableScanner(newTransfer.id);
            await transfer.onFail(newTransfer);
          }
        }
      },
      remove: (id: string) => {
        set(state => {
          delete state.transfers[id];
        });
      },
    })),
    {
      name: 'bridge-transfer-history-store',
      storage,
    },
  ),
  //   { name: 'BridgeTransferHistoryStore' },
  // ),
);

export const bridgeTransferHistoryActions = {
  get: (id: string | null) => {
    return useBridgeTransferHistoryStore.getState().getTransfer(id);
  },

  add: (transfer: BridgeTransfer) => {
    useBridgeTransferHistoryStore.getState().addTransfer(transfer);
  },

  updateSourceTransaction: (id: string, { rawTx }) => {
    useBridgeTransferHistoryStore.getState().updateSourceTransaction(id, { rawTx });
  },
  updateTransferEvents: async (id: string, events: XCallEventMap) => {
    await useBridgeTransferHistoryStore.getState().updateTransferEvents(id, events);
  },

  remove: (id: string) => {
    useBridgeTransferHistoryStore.getState().remove(id);
  },

  getPendingTransfers: (signedWallets: { chain: XChain; chainId: XChainId; address: string }[]) => {
    return Object.values(useBridgeTransferHistoryStore.getState().transfers).filter(transfer => {
      const parentTransfer = transfer.parentTransferId
        ? useBridgeTransferHistoryStore.getState().transfers[transfer.parentTransferId]
        : undefined;
      return (
        (transfer.status !== BridgeTransferStatus.CALL_EXECUTED &&
          transfer.status !== BridgeTransferStatus.TRANSFER_FAILED &&
          signedWallets.some(wallet => wallet.chainId === transfer.sourceChainId)) ||
        (parentTransfer &&
          parentTransfer.status !== BridgeTransferStatus.CALL_EXECUTED &&
          parentTransfer.status !== BridgeTransferStatus.TRANSFER_FAILED &&
          signedWallets.some(wallet => wallet.chainId === parentTransfer.sourceChainId))
      );
    });
  },

  getTransferStatusMessage: (transfer: BridgeTransfer) => {
    switch (transfer.status) {
      case BridgeTransferStatus.TRANSFER_REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}...`;
      case BridgeTransferStatus.TRANSFER_FAILED:
        return `Transfer failed.`;
      case BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}...`;
      case BridgeTransferStatus.CALL_MESSAGE_SENT:
        return `Finalising transaction on ${getNetworkDisplayName(transfer.destinationChainId)}...`;
      case BridgeTransferStatus.CALL_MESSAGE:
        return `Finalising transaction on ${getNetworkDisplayName(transfer.destinationChainId)}...`;
      case BridgeTransferStatus.CALL_EXECUTED:
        return `Complete.`;
      default:
        return `Unknown state.`;
    }
  },
};

export const useFetchBridgeTransferEvents = (transfer?: BridgeTransfer) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      if (!transfer) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransaction } = transfer;

      let events: XCallEventMap = {};
      if (transfer.status === BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        events = await srcChainXCallService.getSourceEvents(sourceTransaction);
      } else if (
        transfer.status === BridgeTransferStatus.CALL_MESSAGE_SENT ||
        transfer.status === BridgeTransferStatus.CALL_MESSAGE
        // || transfer.status === BridgeTransferStatus.CALL_EXECUTED
      ) {
        const callMessageSentEvent = transfer.events[XCallEventType.CallMessageSent];
        if (callMessageSentEvent) {
          events = xCallEventActions.getDestinationEvents(destinationChainId, callMessageSentEvent.sn);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled:
      !!transfer?.id &&
      transfer?.status !== BridgeTransferStatus.CALL_EXECUTED &&
      transfer?.status !== BridgeTransferStatus.TRANSFER_FAILED,
  });

  return {
    events,
    isLoading,
  };
};

export const BridgeTransferStatusUpdater = ({ transfer }) => {
  const { id, sourceChainId, destinationChainId, destinationChainInitialBlockHeight, status } = transfer || {};

  useCreateXCallService(sourceChainId);
  useCreateXCallService(destinationChainId);

  useXCallEventScanner(id);

  const { rawTx } = useFetchTransaction(transfer?.sourceTransaction);
  const { events } = useFetchBridgeTransferEvents(transfer);

  useEffect(() => {
    if (id && rawTx) {
      bridgeTransferHistoryActions.updateSourceTransaction(id, { rawTx });
    }
  }, [id, rawTx]);

  useEffect(() => {
    if (id && events) {
      bridgeTransferHistoryActions.updateTransferEvents(id, events);
    }
  }, [id, events]);

  useEffect(() => {
    if (id) {
      if (
        status !== BridgeTransferStatus.CALL_EXECUTED &&
        status !== BridgeTransferStatus.TRANSFER_FAILED &&
        !xCallEventActions.isScannerEnabled(destinationChainId)
      ) {
        xCallEventActions.enableScanner(id, destinationChainId, BigInt(destinationChainInitialBlockHeight));
      }
    }
  }, [id, status, destinationChainId, destinationChainInitialBlockHeight]);

  return null;
};
