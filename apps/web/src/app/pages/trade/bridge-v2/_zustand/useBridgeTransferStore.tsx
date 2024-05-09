import { create } from 'zustand';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import { BridgeInfo, BridgeTransfer, BridgeTransferStatus } from './types';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { transactionActions, useFetchTransaction } from './useTransactionStore';
import { useEffect } from 'react';
import {
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
  useFetchBridgeTransferEvents,
} from './useBridgeTransferHistoryStore';

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

    const sourceTransactionHash = await srcChainXCallService.executeTransfer(bridgeInfo);

    if (!sourceTransactionHash) {
      bridgeTransferActions.reset();
      return;
    }

    bridgeTransferActions.setIsTransferring(true);
    const sourceTransaction = transactionActions.add(bridgeDirection.from, {
      hash: sourceTransactionHash,
      pendingMessage: 'Requesting cross-chain transfer...',
      successMessage: 'Cross-chain transfer requested.',
      errorMessage: 'Cross-chain transfer failed.',
    });

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.fetchBlockHeight()) - 1n;
      console.log('blockHeight', blockHeight);

      const transfer: BridgeTransfer = {
        id: `${bridgeDirection.from}/${sourceTransaction.hash}`,
        sourceChainId: bridgeDirection.from,
        destinationChainId: bridgeDirection.to,
        sourceTransaction,
        // bridgeInfo,
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

  reset: () => {
    useBridgeTransferStore.setState({
      transferId: null,
      isTransferring: false,
    });
  },

  success: () => {
    xCallEventActions.stopAllScanners();

    bridgeTransferConfirmModalActions.closeModal();

    bridgeTransferActions.reset();

    // TODO: show success message
    console.log('bridge transfer success');
  },

  fail: () => {
    xCallEventActions.stopAllScanners();

    bridgeTransferActions.reset();

    // TODO: show error message
    console.log('bridge transfer fail');
  },
};

export const BridgeTransferStatusUpdater = () => {
  useBridgeTransferHistoryStore();
  const { transferId } = useBridgeTransferStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);

  useXCallEventScanner(transfer?.sourceChainId);
  useXCallEventScanner(transfer?.destinationChainId);

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
