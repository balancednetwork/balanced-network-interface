import { create } from 'zustand';
import { xCallServiceActions } from './useXCallServiceStore';
import { modalActions, MODAL_ID } from './useModalStore';
import { BridgeTransfer, BridgeTransferStatus, BridgeTransferType, XSwapInfo } from './types';
import { transactionActions } from './useTransactionStore';
import { bridgeTransferHistoryActions } from './useBridgeTransferHistoryStore';

type BridgeTransferStore = {
  transferId: string | null;
};

export const useBridgeTransferStore = create<BridgeTransferStore>()(set => ({
  transferId: null,
}));

export const bridgeTransferActions = {
  executeTransfer: async (xSwapInfo: XSwapInfo, onSuccess = () => {}) => {
    const { direction } = xSwapInfo;
    const sourceChainId = direction.from;
    const destinationChainId = direction.to;
    const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
    const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

    const sourceTransactionHash = await srcChainXCallService.executeTransfer(xSwapInfo);

    if (!sourceTransactionHash) {
      bridgeTransferActions.reset();
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
          bridgeTransferActions.success(transfer);
        },
        onFail: async transfer => {
          bridgeTransferActions.fail(transfer);
        },
      };

      bridgeTransferHistoryActions.add(transfer);
      useBridgeTransferStore.setState({ transferId: transfer.id });
    }
  },

  reset: () => {
    useBridgeTransferStore.setState({
      transferId: null,
    });
  },

  success: transfer => {
    modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);

    bridgeTransferActions.reset();

    // TODO: show success message
  },

  fail: transfer => {
    bridgeTransferActions.reset();

    // TODO: show error message
  },
};
