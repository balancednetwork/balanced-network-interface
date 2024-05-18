import { create } from 'zustand';
import { xCallServiceActions } from '../../bridge/_zustand/useXCallServiceStore';
import { modalActions, MODAL_ID } from '../../bridge/_zustand/useModalStore';
import { BridgeTransfer, BridgeTransferStatus, BridgeTransferType, XSwapInfo } from '../../bridge/_zustand/types';
import { useXCallEventScanner, xCallEventActions } from '../../bridge/_zustand/useXCallEventStore';
import { transactionActions, useFetchTransaction } from '../../bridge/_zustand/useTransactionStore';
import { useEffect } from 'react';
import {
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
  useFetchBridgeTransferEvents,
} from '../../bridge/_zustand/useBridgeTransferHistoryStore';

type XSupplyStore = {
  transferId: string | null;
};

export const useXSupplyStore = create<XSupplyStore>()(set => ({
  transferId: null,
}));

export const xSupplyActions = {
  sendXToken: async (xSwapInfo: XSwapInfo, onSuccess = () => {}) => {
    const { direction } = xSwapInfo;
    const sourceChainId = direction.from;
    const destinationChainId = direction.to;
    const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
    const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

    console.log('xSwapInfo', xSwapInfo);
    console.log('all xCallServices', xCallServiceActions.getAllXCallServices());
    console.log('srcChainXCallService', srcChainXCallService);
    console.log('dstChainXCallService', dstChainXCallService);

    const sourceTransactionHash = await srcChainXCallService.executeTransfer(xSwapInfo);

    if (!sourceTransactionHash) {
      xSupplyActions.reset();
      return;
    }

    const sourceTransaction = transactionActions.add(sourceChainId, {
      hash: sourceTransactionHash,
      pendingMessage: 'Requesting cross-chain transfer...',
      successMessage: 'Cross-chain transfer requested.',
      errorMessage: 'Cross-chain transfer failed.',
    });

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;
      console.log('blockHeight', blockHeight);

      const transfer: BridgeTransfer = {
        id: `${sourceChainId}/${sourceTransaction.hash}`,
        type: BridgeTransferType.BRIDGE,
        sourceChainId: sourceChainId,
        destinationChainId: destinationChainId,
        sourceTransaction,
        xSwapInfo,
        status: BridgeTransferStatus.TRANSFER_REQUESTED,
        events: {},
        destinationChainInitialBlockHeight: blockHeight,
        childTransferNeeded: false,
        onSuccess: async transfer => {
          onSuccess();
          xSupplyActions.success(transfer);
        },
        onFail: async transfer => {
          xSupplyActions.fail(transfer);
        },
      };

      bridgeTransferHistoryActions.add(transfer);
      useXSupplyStore.setState({ transferId: transfer.id });
    }
  },

  reset: () => {
    useXSupplyStore.setState({
      transferId: null,
    });
  },

  success: transfer => {
    modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
    xSupplyActions.reset();

    // TODO: show success message
    console.log('bridge transfer success');
  },

  fail: transfer => {
    xSupplyActions.reset();

    // TODO: show error message
    console.log('bridge transfer fail');
  },
};
