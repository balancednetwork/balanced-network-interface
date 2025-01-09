import { useMemo } from 'react';

import { getXWalletClient } from '@/actions';
import { xChainMap } from '@/constants';
import { XChainId } from '@/types';
import { transactionActions, xChainHeightActions, xMessageActions, xTransactionActions } from '@/xcall';
import { XMessage, XMessageStatus, XTransaction, XTransactionInput, XTransactionStatus } from '@/xcall/types';
import { useSignTransaction } from '@mysten/dapp-kit';

const iconChainId: XChainId = '0x1.icon';

const sendXTransaction = async (xTransactionInput: XTransactionInput, options: any) => {
  const { direction } = xTransactionInput;
  const sourceChainId = direction.from;

  const srcXWalletClient = getXWalletClient(sourceChainId);
  if (!srcXWalletClient) {
    throw new Error('WalletXService for source chain is not found');
  }

  const sourceTransactionHash = await srcXWalletClient.executeTransaction(xTransactionInput, options);
  if (!sourceTransactionHash) {
    return;
  }

  transactionActions.add(sourceChainId, {
    hash: sourceTransactionHash,
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const finalDestinationChainId = direction.to;
  const primaryDestinationChainId = sourceChainId === iconChainId ? finalDestinationChainId : iconChainId;

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

  const xMessage: XMessage = {
    id: `${sourceChainId}/${sourceTransactionHash}`,
    xTransactionId: xTransaction.id,
    sourceChainId: sourceChainId,
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

  return xTransaction.id;
};

export const useSendXTransaction = () => {
  const { mutateAsync: signTransaction } = useSignTransaction();

  return useMemo(
    () => ({
      sendXTransaction: (xTransactionInput: XTransactionInput) =>
        sendXTransaction(xTransactionInput, { signTransaction }),
    }),
    [signTransaction],
  );
};
