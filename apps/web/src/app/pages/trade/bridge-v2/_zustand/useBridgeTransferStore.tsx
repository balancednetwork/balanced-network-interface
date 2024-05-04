import { create } from 'zustand';
import { useBridgeDirection, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useQuery } from '@tanstack/react-query';
import { XCallEventType } from 'app/pages/trade/bridge-v2/types';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import {
  BridgeInfo,
  BridgeTransfer,
  BridgeTransferStatus,
  Transaction,
  TransactionStatus,
  XCallEvent,
  XCallEventMap,
} from './types';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { useFetchTransaction } from './useTransactionStore';
import { useEffect } from 'react';
import { update } from 'lodash-es';

type BridgeTransferStore = {
  transfer: BridgeTransfer | null;
  isTransferring: boolean;
};

export const useBridgeTransferStore = create<BridgeTransferStore>()(set => ({
  transfer: null,
  isTransferring: false,
}));

// TODO: review logic
const deriveStatus = (sourceTransaction: Transaction, events: XCallEventMap): BridgeTransferStatus => {
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
    if (!events[XCallEventType.CallMessageSent]) {
      return BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT;
    }

    if (!events[XCallEventType.CallMessage]) {
      return BridgeTransferStatus.CALL_MESSAGE_SENT;
    }

    if (!events[XCallEventType.CallExecuted]) {
      return BridgeTransferStatus.CALL_MESSAGE;
    } else {
      return BridgeTransferStatus.CALL_EXECUTED;
    }
  }

  return BridgeTransferStatus.TRANSFER_FAILED;
};

export const bridgeTransferActions = {
  setIsTransferring: (isTransferring: boolean) => {
    useBridgeTransferStore.setState({ isTransferring });
  },

  executeTransfer: async (bridgeInfo: BridgeInfo) => {
    const { bridgeDirection } = bridgeInfo;
    const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
    const dstChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.to);

    console.log('bridgeInfo', bridgeInfo);
    console.log('all xCallServices', xCallServiceActions.getAllXCallServices());
    console.log('srcChainXCallService', srcChainXCallService);
    console.log('dstChainXCallService', dstChainXCallService);

    // return;

    const transfer = await srcChainXCallService.executeTransfer(bridgeInfo);
    const blockHeight = (await dstChainXCallService.fetchBlockHeight()) - 1n;

    if (!transfer) {
      return;
    }

    useBridgeTransferStore.setState({
      transfer: {
        ...transfer,
        destinationChainInitialBlockHeight: blockHeight,
      },
    });

    console.log('blockHeight', blockHeight);

    xCallEventActions.startScanner(bridgeDirection.to, blockHeight);

    // TODO:  add transfer to history
  },

  updateSourceTransaction: ({ rawTx }) => {
    useBridgeTransferStore.setState((prevState: BridgeTransferStore) => {
      if (!prevState.transfer) {
        return prevState;
      }

      const transfer = prevState.transfer;

      const newSourceTransactionStatus = xCallServiceActions
        .getXCallService(transfer.bridgeInfo.bridgeDirection.from)
        .deriveTxStatus(rawTx);

      const newSourceTransaction = {
        ...prevState.transfer.sourceTransaction,
        rawTx,
        status: newSourceTransactionStatus,
      };
      const newStatus = deriveStatus(newSourceTransaction, transfer.events);

      return {
        ...prevState,
        transfer: {
          ...prevState.transfer,
          sourceTransaction: newSourceTransaction,
          status: newStatus,
        },
      };
    });
  },

  updateTransferEvents: (events: XCallEventMap) => {
    useBridgeTransferStore.setState((prevState: BridgeTransferStore) => {
      if (!prevState.transfer) {
        return prevState;
      }

      const transfer = prevState.transfer;

      const newEvents = {
        ...transfer.events,
        ...events,
      };

      const newStatus = deriveStatus(transfer.sourceTransaction, newEvents);

      return {
        ...prevState,
        transfer: {
          ...transfer,
          events: newEvents,
          status: newStatus,
        },
      };
    });
  },

  success: () => {
    xCallEventActions.stopAllScanners();

    bridgeTransferConfirmModalActions.closeModal();

    useBridgeTransferStore.setState({
      transfer: null,
      isTransferring: false,
    });

    // TODO: show success message
    console.log('bridge transfer success');
  },

  fail: () => {
    xCallEventActions.stopAllScanners();

    useBridgeTransferStore.setState({
      transfer: null,
      isTransferring: false,
    });

    // TODO: show error message
    console.log('bridge transfer fail');
  },
};

export const useFetchBridgeTransferEvents = transfer => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      console.log('transfer', transfer);
      if (!transfer) {
        return null;
      }

      const {
        bridgeInfo: { bridgeDirection },
      } = transfer;

      let events: XCallEventMap = {};
      if (transfer.status === BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
        events = await srcChainXCallService.fetchSourceEvents(transfer);
      } else if (
        transfer.status === BridgeTransferStatus.CALL_MESSAGE_SENT ||
        transfer.status === BridgeTransferStatus.CALL_MESSAGE
        // || transfer.status === BridgeTransferStatus.CALL_EXECUTED
      ) {
        console.log('transfer.status !== BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT', transfer.events);
        const callMessageSentEvent = transfer.events[XCallEventType.CallMessageSent];
        console.log('callMessageSentEvent', callMessageSentEvent);
        if (callMessageSentEvent) {
          console.log('callMessageSentEvent', callMessageSentEvent);
          events = xCallEventActions.getDestinationEvents(bridgeDirection.to, callMessageSentEvent.sn);
          console.log('events', events);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled: !!transfer?.id,
  });

  return {
    events,
    isLoading,
  };
};

export const BridgeTransferStatusUpdater = () => {
  const { transfer } = useBridgeTransferStore();

  useXCallEventScanner(transfer?.bridgeInfo?.bridgeDirection.from);
  useXCallEventScanner(transfer?.bridgeInfo?.bridgeDirection.to);

  const { rawTx } = useFetchTransaction(transfer?.sourceTransaction);
  const { events } = useFetchBridgeTransferEvents(transfer);

  useEffect(() => {
    if (rawTx) {
      bridgeTransferActions.updateSourceTransaction({ rawTx });
    }
  }, [rawTx]);

  useEffect(() => {
    if (events) {
      bridgeTransferActions.updateTransferEvents(events);
    }
  }, [events]);

  useEffect(() => {
    if (transfer) {
      if (transfer.status === BridgeTransferStatus.CALL_EXECUTED) {
        bridgeTransferActions.success();
      }
      if (transfer.status === BridgeTransferStatus.TRANSFER_FAILED) {
        bridgeTransferActions.fail();
      }
    }
  }, [transfer, transfer?.status]);

  return null;
};
