import { create } from 'zustand';

import { swapMessage } from 'app/pages/trade/supply/_components/utils';

import { XChainId } from '../../bridge/types';
import { BridgeTransfer, BridgeTransferStatus, BridgeTransferType, XSwapInfo } from '../../bridge/_zustand/types';
import { MODAL_ID, modalActions } from '../../bridge/_zustand/useModalStore';
import { xCallServiceActions } from '../../bridge/_zustand/useXCallServiceStore';
import { transactionActions } from '../../bridge/_zustand/useTransactionStore';
import { bridgeTransferHistoryActions } from '../../bridge/_zustand/useBridgeTransferHistoryStore';

type XCallSwapStore = {
  transferId: string | null;
  childTransferId: string | null;
};

export const useXCallSwapStore = create<XCallSwapStore>()(() => ({
  transferId: null,
  childTransferId: null,
}));

export const xCallSwapActions = {
  executeSwap: async (xSwapInfo: XSwapInfo & { cleanupSwap: () => void }) => {
    const iconChainId: XChainId = '0x1.icon';
    const { direction, executionTrade, cleanupSwap } = xSwapInfo;
    const sourceChainId = direction.from;
    const destinationChainId = direction.to;
    const _destinationChainId = sourceChainId === iconChainId ? destinationChainId : iconChainId;

    const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
    const dstChainXCallService = xCallServiceActions.getXCallService(_destinationChainId);

    const sourceTransactionHash = await srcChainXCallService.executeSwap(xSwapInfo);

    if (!sourceTransactionHash || !executionTrade) {
      xCallSwapActions.reset();
      return;
    }

    const swapMessages = swapMessage(
      executionTrade.inputAmount.toFixed(2),
      executionTrade.inputAmount.currency.symbol || 'IN',
      executionTrade.outputAmount.toFixed(2),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

    const sourceTransaction = transactionActions.add(sourceChainId, {
      hash: sourceTransactionHash,
      pendingMessage: swapMessages.pendingMessage,
      successMessage: swapMessages.successMessage,
      errorMessage: 'Cross-chain swap failed.',
    });
    cleanupSwap?.();

    if (sourceTransaction && sourceTransaction.hash) {
      const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;

      const transfer: BridgeTransfer = {
        id: `${sourceChainId}/${sourceTransaction.hash}`,
        type: BridgeTransferType.SWAP,
        sourceChainId: sourceChainId,
        destinationChainId: _destinationChainId,
        sourceTransaction,
        status: BridgeTransferStatus.TRANSFER_REQUESTED,
        events: {},
        destinationChainInitialBlockHeight: blockHeight,
        childTransferNeeded: destinationChainId !== _destinationChainId,
        xSwapInfo,
        onSuccess: async transfer => {
          if (transfer.childTransferNeeded) {
            await xCallSwapActions.createChildTransfer(transfer);
          } else {
            xCallSwapActions.success();
          }
        },
        onFail: async transfer => {
          xCallSwapActions.fail();
        },
      };

      bridgeTransferHistoryActions.add(transfer);
      useXCallSwapStore.setState({ transferId: transfer.id });
    }
  },

  createChildTransfer: async (transfer: BridgeTransfer) => {
    if (!transfer.destinationTransaction) {
      throw new Error('destinationTransaction is not found'); // it should not happen
    }

    const sourceChainId = transfer.destinationChainId;
    const destinationChainId = transfer.xSwapInfo?.direction.to;
    const sourceTransaction = transfer.destinationTransaction;

    const dstChainXCallService = xCallServiceActions.getXCallService(destinationChainId);

    const blockHeight = (await dstChainXCallService.getBlockHeight()) - 1n;

    const childTransferId = `${sourceChainId}/${sourceTransaction?.hash}`;
    const childTransfer: BridgeTransfer = {
      id: childTransferId,
      type: BridgeTransferType.SWAP,
      sourceChainId,
      destinationChainId,
      sourceTransaction: sourceTransaction,
      status: BridgeTransferStatus.TRANSFER_REQUESTED,
      events: {},
      destinationChainInitialBlockHeight: blockHeight,
      childTransferNeeded: false,
      parentTransferId: transfer.id,
      xSwapInfo: transfer.xSwapInfo,
      onSuccess: async (_transfer: BridgeTransfer) => {
        xCallSwapActions.success();
      },
      onFail: async (_transfer: BridgeTransfer) => {
        xCallSwapActions.fail();
      },
    };

    bridgeTransferHistoryActions.add(childTransfer);

    useXCallSwapStore.setState({ childTransferId: childTransfer.id });
  },

  reset: () => {
    useXCallSwapStore.setState({
      transferId: null,
      childTransferId: null,
    });
  },

  success: () => {
    modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
    xCallSwapActions.reset();

    // TODO: show success message
  },

  fail: () => {
    xCallSwapActions.reset();

    // TODO: show error message
  },
};
