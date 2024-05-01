import { create } from 'zustand';
import { useBridgeDirection, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useQuery } from '@tanstack/react-query';
import { XCallEventType } from 'app/_xcall/types';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import { BridgeInfo, BridgeTransfer, BridgeTransferStatus, XCallEvent, XCallEventMap } from './types';
import { xCallEventActions } from './useXCallEventStore';

type BridgeTransferStore = {
  transfer: BridgeTransfer | null;
  isTransferring: boolean;
};

export const useBridgeTransferStore = create<BridgeTransferStore>()(set => ({
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

    console.log('blockHeight', blockHeight);

    xCallEventActions.startScanner(bridgeDirection.to, blockHeight);
  },

  updateTransferEvents: (events: XCallEventMap) => {
    console.log('update transfer events', events);
    const transfer = useBridgeTransferStore.getState().transfer;
    if (!transfer) {
      return;
    }

    const newEvents = {
      ...transfer.events,
      ...events,
    };
    const newStatus = deriveStatus(newEvents);

    useBridgeTransferStore.setState({
      transfer: {
        ...transfer,
        events: newEvents,
        status: newStatus,
      },
    });

    // TODO: is it right place to call success
    if (newStatus === BridgeTransferStatus.CALL_EXECUTED) {
      bridgeTransferActions.success();
    }
  },

  success: () => {
    xCallEventActions.stopAllScanners();

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
      console.log('transfer', transfer);
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
        const callMessageSentEvent = transfer.events[XCallEventType.CallMessageSent];
        if (callMessageSentEvent) {
          events = xCallEventActions.getDestinationEvents(bridgeDirection.to, callMessageSentEvent.sn);
        }
      }

      bridgeTransferActions.updateTransferEvents(events);

      return events;
    },
    refetchInterval: 2000,
    enabled: !!transfer?.id,
  });
};
