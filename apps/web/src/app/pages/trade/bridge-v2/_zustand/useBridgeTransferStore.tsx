import { create } from 'zustand';
import { xCallServiceActions } from './useXCallServiceStore';
import { bridgeTransferConfirmModalActions } from './useBridgeTransferConfirmModalStore';
import { BridgeInfo, BridgeTransfer, BridgeTransferStatus, BridgeTransferType } from './types';
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
  isProcessing: boolean;
};

export const useBridgeTransferStore = create<BridgeTransferStore>()(set => ({
  transferId: null,
  isProcessing: false,
}));

export const bridgeTransferActions = {
  setIsProcessing: (isProcessing: boolean) => {
    useBridgeTransferStore.setState({ isProcessing });
  },

  executeTransfer: async (bridgeInfo: BridgeInfo) => {
    const { bridgeDirection } = bridgeInfo;
    const sourceChainId = bridgeDirection.from;
    const destinationChainId = bridgeDirection.to;
    const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
    const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

    console.log('bridgeInfo', bridgeInfo);
    console.log('all xCallServices', xCallServiceActions.getAllXCallServices());
    console.log('srcChainXCallService', srcChainXCallService);
    console.log('dstChainXCallService', dstChainXCallService);

    const sourceTransactionHash = await srcChainXCallService.executeTransfer(bridgeInfo);

    if (!sourceTransactionHash) {
      bridgeTransferActions.reset();
      return;
    }

    bridgeTransferActions.setIsProcessing(true);
    const sourceTransaction = transactionActions.add(sourceChainId, {
      hash: sourceTransactionHash,
      pendingMessage: 'Requesting cross-chain transfer...',
      successMessage: 'Cross-chain transfer requested.',
      errorMessage: 'Cross-chain transfer failed.',
    });

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.fetchBlockHeight()) - 1n;
      console.log('blockHeight', blockHeight);

      const _tokenSymbol = bridgeInfo.currencyAmountToBridge.currency.symbol;
      const _formattedAmount = bridgeInfo.currencyAmountToBridge.toFixed(2);
      const transfer: BridgeTransfer = {
        id: `${sourceChainId}/${sourceTransaction.hash}`,
        type: BridgeTransferType.BRIDGE,
        sourceChainId: sourceChainId,
        destinationChainId: destinationChainId,
        descriptionAction: `Transfer ${_tokenSymbol}`,
        descriptionAmount: `${_formattedAmount} ${_tokenSymbol}`,
        sourceTransaction,
        // bridgeInfo,
        status: BridgeTransferStatus.TRANSFER_REQUESTED,
        events: {},
        destinationChainInitialBlockHeight: blockHeight,
      };

      bridgeTransferHistoryActions.add(transfer);
      useBridgeTransferStore.setState({ transferId: transfer.id });

      // TODO: is it right place to start scanner?
      xCallEventActions.startScanner(destinationChainId, blockHeight);
    }
  },

  reset: () => {
    useBridgeTransferStore.setState({
      transferId: null,
      isProcessing: false,
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
