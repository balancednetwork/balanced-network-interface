import { create } from 'zustand';
import { useBridgeDirection, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useQuery } from '@tanstack/react-query';
import { XCallEventType } from 'app/_xcall/types';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import { BridgeInfo, BridgeTransfer, BridgeTransferStatus, XCallEvent, XCallEventMap } from './types';

type BridgeTransferStore = {
  transfer: BridgeTransfer | null;
  isTransferring: boolean;
};

export const useBridgeTransferStore = create<BridgeTransferStore>(set => ({
  transfer: null,
  isTransferring: false,
}));

// TODO: review logic
const deriveStatus = (events: XCallEventMap) => {
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

  executeTransfer: async (bridgeInfo: BridgeInfo) => {
    const { bridgeDirection } = bridgeInfo;
    const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
    const dstChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.to);

    const transfer = await srcChainXCallService.executeTransfer(bridgeInfo);
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

  updateTransferEvents: (events: XCallEventMap) => {
    const transfer = useBridgeTransferStore.getState().transfer;
    if (!transfer) {
      return;
    }

    const newEvents = {
      ...transfer.events,
      ...events,
    };
    const newStatus = deriveStatus(newEvents);
    if (newStatus === BridgeTransferStatus.CALL_EXECUTED) {
      bridgeTransferActions.success();
    }

    useBridgeTransferStore.setState({
      transfer: {
        ...transfer,
        events: newEvents,
        status: newStatus,
      },
    });
  },

  success: () => {
    bridgeTransferConfirmModalActions.closeModal();

    useBridgeTransferStore.setState({
      transfer: null,
      isTransferring: false,
    });
  },
};

export const useFetchBridgeTransferEvents = () => {
  const { transfer } = useBridgeTransferStore();

  useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      if (!transfer) {
        return {};
      }

      const {
        bridgeInfo: { bridgeDirection },
      } = transfer;

      let events: XCallEventMap = {};
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
