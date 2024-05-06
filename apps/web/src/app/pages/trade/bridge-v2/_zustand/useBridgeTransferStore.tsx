import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { XCallEventType } from 'app/pages/trade/bridge-v2/types';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import { BridgeInfo, BridgeTransferStatus, Transaction, XCallEventMap } from './types';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { transactionActions, useFetchTransaction } from './useTransactionStore';
import { useEffect } from 'react';
import { bridgeTransferHistoryActions, useBridgeTransferHistoryStore } from './useBridgeTransferHistoryStore';
import { ArchwayXCallService } from '../_xcall/ArchwayXCallService';

type BridgeTransferStore = {
  transferId: string | null;
  isTransferring: boolean;
};

export const useBridgeTransferStore = create<BridgeTransferStore>()(set => ({
  transferId: null,
  isTransferring: false,
}));

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

    let sourceTransaction: Transaction | undefined;

    if (srcChainXCallService instanceof ArchwayXCallService) {
      bridgeTransferActions.setIsTransferring(true);

      sourceTransaction = transactionActions.add(bridgeDirection.from, {
        status: 'pending',
        pendingMessage: 'Requesting cross-chain transfer...',
        successMessage: 'Cross-chain transfer requested.',
        errorMessage: 'Cross-chain transfer request failed',
      });

      const { sourceTransactionHash, sourceTransactionResult } = await srcChainXCallService.executeTransfer(bridgeInfo);

      if (sourceTransactionHash) {
        sourceTransaction = transactionActions.updateTx(bridgeDirection.from, sourceTransaction.id, {
          hash: sourceTransactionHash,
          rawTx: sourceTransactionResult,
        });
      } else {
        bridgeTransferActions.setIsTransferring(false);
        transactionActions.updateTx(bridgeDirection.from, sourceTransaction.id, {});
      }
    } else {
      const { sourceTransactionHash } = (await srcChainXCallService.executeTransfer(bridgeInfo)) || {};

      if (!sourceTransactionHash) {
        bridgeTransferActions.setIsTransferring(false);
        return;
      }

      bridgeTransferActions.setIsTransferring(true);
      sourceTransaction = transactionActions.add(bridgeDirection.from, {
        hash: sourceTransactionHash,
        pendingMessage: 'Requesting cross-chain transfer...',
        successMessage: 'Cross-chain transfer requested.',
        errorMessage: 'Cross-chain transfer failed.',
      });
    }

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.fetchBlockHeight()) - 1n;
      console.log('blockHeight', blockHeight);

      const transfer = {
        id: `${bridgeDirection.from}/${sourceTransaction.hash}`,
        bridgeInfo,
        sourceTransaction,
        status: BridgeTransferStatus.TRANSFER_REQUESTED,
        events: {},
        destinationChainInitialBlockHeight: blockHeight,
      };

      bridgeTransferHistoryActions.add(transfer);
      useBridgeTransferStore.setState({ transferId: transfer.id });

      // TODO: is it right place to start scanner?
      xCallEventActions.startScanner(bridgeDirection.to, blockHeight);
    }
  },

  success: () => {
    xCallEventActions.stopAllScanners();

    bridgeTransferConfirmModalActions.closeModal();

    useBridgeTransferStore.setState({
      transferId: null,
      isTransferring: false,
    });

    // TODO: show success message
    console.log('bridge transfer success');
  },

  fail: () => {
    xCallEventActions.stopAllScanners();

    useBridgeTransferStore.setState({
      transferId: null,
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
    enabled:
      !!transfer?.id &&
      transfer.status !== BridgeTransferStatus.CALL_EXECUTED &&
      transfer.status !== BridgeTransferStatus.TRANSFER_FAILED,
  });

  return {
    events,
    isLoading,
  };
};

export const BridgeTransferStatusUpdater = () => {
  useBridgeTransferHistoryStore();
  const { transferId } = useBridgeTransferStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);

  useXCallEventScanner(transfer?.bridgeInfo?.bridgeDirection.from);
  useXCallEventScanner(transfer?.bridgeInfo?.bridgeDirection.to);

  const { rawTx } = useFetchTransaction(transfer?.sourceTransaction);
  const { events } = useFetchBridgeTransferEvents(transfer);

  useEffect(() => {
    if (transferId && rawTx) {
      bridgeTransferHistoryActions.updateSourceTransaction(transferId, { rawTx });
    }
  }, [transferId, rawTx]);

  useEffect(() => {
    if (transferId && events) {
      bridgeTransferHistoryActions.updateTransferEvents(transferId, events);
    }
  }, [transferId, events]);

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
