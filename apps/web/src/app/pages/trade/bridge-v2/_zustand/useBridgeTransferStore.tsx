// @ts-nocheck
import { create } from 'zustand';
import { useBridgeDirection, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useQuery } from '@tanstack/react-query';
import { XCallEventType } from 'app/_xcall/types';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';

export enum BridgeTransferStatus {
  AWAITING_CALL_MESSAGE_SENT = 'AWAITING_CALL_MESSAGE_SENT',
  CALL_MESSAGE_SENT = 'CALL_MESSAGE_SENT',
  CALL_MESSAGE = 'CALL_MESSAGE',
  CALL_EXECUTED = 'CALL_EXECUTED',
}

export const useBridgeTransferStore = create(set => ({
  transfer: {
    id: '1',
    bridgeInfo: {},
    transactions: [],
    events: {},
    status: BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT,
    destinationChainInitialBlockHeight: -1,
  },

  isTransferring: false,
}));

// TODO: review logic
const deriveStatus = events => {
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
};

export const bridgeTransferActions = {
  setIsTransferring: (isTransferring: boolean) => {
    useBridgeTransferStore.setState({ isTransferring });
  },

  executeTransfer: async transferData => {
    const {
      bridgeInfo: { bridgeDirection },
    } = transferData;
    const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
    const dstChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.to);

    const transfer = await srcChainXCallService.executeTransfer(transferData);
    const blockHeight = (await dstChainXCallService.fetchBlockHeight()) - 1;

    if (!transfer) {
      return;
    }

    useBridgeTransferStore.setState({
      transfer: {
        ...transfer,
        destinationChainInitialBlockHeight: blockHeight,
      },
    });
  },

  updateTransferEvents: events => {
    const newEvents = {
      ...useBridgeTransferStore.getState().transfer.events,
      ...events,
    };
    const newStatus = deriveStatus(newEvents);
    if (newStatus === BridgeTransferStatus.CALL_EXECUTED) {
      bridgeTransferActions.success();
    }

    useBridgeTransferStore.setState({
      transfer: {
        ...useBridgeTransferStore.getState().transfer,
        events: newEvents,
        status: newStatus,
      },
    });
  },

  success: () => {
    bridgeTransferConfirmModalActions.closeModal();

    useBridgeTransferStore.setState({
      transfer: {},
      isTransferring: false,
    });
  },
};

export const useFetchBridgeTransferEvents = () => {
  const { transfer } = useBridgeTransferStore();

  useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      const {
        bridgeInfo: { bridgeDirection },
      } = transfer;

      let events = [];
      if (transfer.status === BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT) {
        // fetch source events
        const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
        events = await srcChainXCallService.fetchSourceEvents(transfer);
      } else {
        // fetch destination events
        const dstChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.to);
        events = await dstChainXCallService.fetchDestinationEvents(transfer);
      }

      bridgeTransferActions.updateTransferEvents(events);

      return events;
    },
    refetchInterval: 2000,
    enabled: !!transfer?.id,
  });
};
