import { useEffect } from 'react';
import { create } from 'zustand';

import { swapMessage } from 'app/components/trade/utils';

import { xCallServiceActions } from '../bridge-v2/_zustand/useXCallServiceStore';
import { BridgeTransfer, BridgeTransferStatus, BridgeTransferType } from '../bridge-v2/_zustand/types';
import { useXCallEventScanner, xCallEventActions } from '../bridge-v2/_zustand/useXCallEventStore';
import { transactionActions, useFetchTransaction } from '../bridge-v2/_zustand/useTransactionStore';
import {
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
  useFetchBridgeTransferEvents,
} from '../bridge-v2/_zustand/useBridgeTransferHistoryStore';
import { xCallSwapModalActions } from './useXCallSwapModalStore';
import { XChainId } from '../bridge-v2/types';

type XCallSwapStore = {
  transferId: string | null;
  childTransferId: string | null;
  isProcessing: boolean;
};

export const useXCallSwapStore = create<XCallSwapStore>()(() => ({
  transferId: null,
  childTransferId: null,
  isProcessing: false,
}));

export const xCallSwapActions = {
  setIsProcessing: (isProcessing: boolean) => {
    useXCallSwapStore.setState({ isProcessing });
  },

  executeSwap: async (swapInfo: any) => {
    const iconChainId: XChainId = '0x1.icon';
    const { sourceChainId, destinationChainId, executionTrade, cleanupSwap } = swapInfo;

    const _destinationChainId = sourceChainId === iconChainId ? destinationChainId : iconChainId;

    const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
    const dstChainXCallService = xCallServiceActions.getXCallService(_destinationChainId);

    console.log('swapInfo', swapInfo);
    console.log('all xCallServices', xCallServiceActions.getAllXCallServices());
    console.log('srcChainXCallService', srcChainXCallService);
    console.log('dstChainXCallService', dstChainXCallService);

    const sourceTransactionHash = await srcChainXCallService.executeSwap(swapInfo);

    if (!sourceTransactionHash) {
      xCallSwapActions.reset();
      return;
    }

    const swapMessages = swapMessage(
      executionTrade.inputAmount.toFixed(2),
      executionTrade.inputAmount.currency.symbol || 'IN',
      executionTrade.outputAmount.toFixed(2),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

    xCallSwapActions.setIsProcessing(true);
    const sourceTransaction = transactionActions.add(sourceChainId, {
      hash: sourceTransactionHash,
      pendingMessage: swapMessages.pendingMessage,
      successMessage: swapMessages.successMessage,
      errorMessage: 'Cross-chain swap failed.',
    });
    cleanupSwap?.();

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;
      console.log('blockHeight', blockHeight);

      const _inputTokenSymbol = executionTrade.inputAmount.currency.symbol || '';
      const _outputTokenSymbol = executionTrade.outputAmount.currency.symbol || '';
      const _inputAmount = executionTrade.inputAmount.toFixed(2);
      const _outputAmount = executionTrade.outputAmount.toFixed(2);

      const transfer: BridgeTransfer = {
        id: `${sourceChainId}/${sourceTransaction.hash}`,
        type: BridgeTransferType.SWAP,
        sourceChainId: sourceChainId,
        destinationChainId: _destinationChainId,
        descriptionAction: `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`,
        descriptionAmount: `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`,
        sourceTransaction,
        status: BridgeTransferStatus.TRANSFER_REQUESTED,
        events: {},
        destinationChainInitialBlockHeight: blockHeight,
        childTransferNeeded: destinationChainId !== _destinationChainId,
        swapInfo: {
          sourceChainId,
          destinationChainId,
        },
      };

      bridgeTransferHistoryActions.add(transfer);
      useXCallSwapStore.setState({ transferId: transfer.id });

      // TODO: is it right place to start scanner?
      xCallEventActions.startScanner(_destinationChainId, blockHeight);
    }
  },

  createChildTransfer: async (transfer: BridgeTransfer) => {
    if (!transfer.destinationTransaction) {
      throw new Error('destinationTransaction is not found'); // it should not happen
    }

    console.log('createChildTransfer');
    const sourceChainId = transfer.destinationChainId;
    const destinationChainId = transfer.swapInfo?.destinationChainId;
    const sourceTransaction = transfer.destinationTransaction;

    const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

    const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;

    const childTransferId = `${sourceChainId}/${sourceTransaction?.hash}`;
    const childTransfer: BridgeTransfer = {
      id: childTransferId,
      type: BridgeTransferType.SWAP,
      sourceChainId,
      destinationChainId,
      descriptionAction: transfer.descriptionAction,
      descriptionAmount: transfer.descriptionAmount,
      sourceTransaction: sourceTransaction,
      status: BridgeTransferStatus.TRANSFER_REQUESTED,
      events: {},
      destinationChainInitialBlockHeight: blockHeight,
      childTransferNeeded: false,
      parentTransferId: transfer.id,
    };

    bridgeTransferHistoryActions.add(childTransfer);

    useXCallSwapStore.setState({ childTransferId: childTransfer.id });
    xCallEventActions.startScanner(childTransfer.destinationChainId, childTransfer.destinationChainInitialBlockHeight);
  },

  reset: () => {
    useXCallSwapStore.setState({
      transferId: null,
      childTransferId: null,
      isProcessing: false,
    });
  },

  success: () => {
    xCallEventActions.stopAllScanners();

    xCallSwapModalActions.closeModal();

    xCallSwapActions.reset();

    // TODO: show success message
    console.log('xcall swap success');
  },

  fail: () => {
    xCallEventActions.stopAllScanners();

    xCallSwapActions.reset();

    // TODO: show error message
    console.log('xcall swap fail');
  },
};

export const XCallSwapStatusUpdater = () => {
  useBridgeTransferHistoryStore();
  const { transferId, childTransferId } = useXCallSwapStore();
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
        xCallEventActions.stopScanner(transfer.destinationChainId);

        if (transfer.childTransferNeeded) {
          xCallSwapActions.createChildTransfer(transfer);
        } else {
          xCallSwapActions.success();
        }
      }
      if (transfer.status === BridgeTransferStatus.TRANSFER_FAILED) {
        xCallSwapActions.fail();
      }
    }
  }, [transfer, transfer?.status]);

  const childTransfer = bridgeTransferHistoryActions.get(childTransferId);

  useXCallEventScanner(childTransfer?.sourceChainId);
  useXCallEventScanner(childTransfer?.destinationChainId);

  const { events: childEvents } = useFetchBridgeTransferEvents(childTransfer);
  // const { rawTx: childRawTx } = useFetchTransaction(childTransfer?.sourceTransaction);

  // useEffect(() => {
  //   if (childTransferId && childRawTx) {
  //     bridgeTransferHistoryActions.updateSourceTransaction(childTransferId, { rawTx: childRawTx });
  //   }
  // }, [childTransferId, childRawTx]);

  useEffect(() => {
    if (childTransferId && childEvents) {
      bridgeTransferHistoryActions.updateTransferEvents(childTransferId, childEvents);
    }
  }, [childTransferId, childEvents]);

  useEffect(() => {
    if (childTransfer) {
      if (childTransfer.status === BridgeTransferStatus.CALL_EXECUTED) {
        xCallSwapActions.success();
      }
      if (childTransfer.status === BridgeTransferStatus.TRANSFER_FAILED) {
        xCallSwapActions.fail();
      }
    }
  }, [childTransfer, childTransfer?.status]);

  return null;
};
