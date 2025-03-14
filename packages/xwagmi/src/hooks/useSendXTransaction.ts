import { getXWalletClient } from '@/actions';
import { ICON_XCALL_NETWORK_ID, xChainMap } from '@/constants';
import { isIconTransaction } from '@/utils';
import { transactionActions, xChainHeightActions, xMessageActions, xTransactionActions } from '@/xcall';
import { XMessage, XMessageStatus, XTransaction, XTransactionInput, XTransactionStatus } from '@/xcall/types';

const sendXTransaction = async (xTransactionInput: XTransactionInput) => {
  const { direction } = xTransactionInput;
  const sourceChainId = direction.from;

  const srcXWalletClient = getXWalletClient(sourceChainId);
  if (!srcXWalletClient) {
    throw new Error('WalletXService for source chain is not found');
  }

  const sourceTransactionHash = await srcXWalletClient.executeTransaction(xTransactionInput);
  if (!sourceTransactionHash) {
    return;
  }

  transactionActions.add(sourceChainId, {
    hash: sourceTransactionHash,
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const finalDestinationChainId = direction.to;
  const primaryDestinationChainId =
    sourceChainId === ICON_XCALL_NETWORK_ID ? finalDestinationChainId : ICON_XCALL_NETWORK_ID;

  const primaryDestinationChainInitialBlockHeight =
    xChainHeightActions.getXChainHeight(primaryDestinationChainId) - 20n;
  const finalDestinationChainInitialBlockHeight = xChainHeightActions.getXChainHeight(finalDestinationChainId);

  const now = Date.now();
  const xTransaction: XTransaction = {
    id: `${sourceChainId}/${sourceTransactionHash}`,
    type: xTransactionInput.type,
    status: XTransactionStatus.pending,
    secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
    sourceChainId: sourceChainId,
    finalDestinationChainId: finalDestinationChainId,
    finalDestinationChainInitialBlockHeight,
    createdAt: now,
    input: xTransactionInput,
  };
  xTransactionActions.add(xTransaction);

  if (!isIconTransaction(sourceChainId, finalDestinationChainId)) {
    const xMessage: XMessage = {
      id: `${sourceChainId}/${sourceTransactionHash}`,
      xTransactionId: xTransaction.id,
      sourceChainId,
      destinationChainId: primaryDestinationChainId,
      sourceTransactionHash,
      status: XMessageStatus.REQUESTED,
      events: {},
      destinationChainInitialBlockHeight: primaryDestinationChainInitialBlockHeight,
      isPrimary: true,
      createdAt: now,
      useXCallScanner: xChainMap[primaryDestinationChainId].useXCallScanner || xChainMap[sourceChainId].useXCallScanner,
    };
    xMessageActions.add(xMessage);
  }

  return xTransaction.id;
};

export const useSendXTransaction = () => {
  return sendXTransaction;
};
