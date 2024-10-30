import { getXWalletClient } from '@/xwagmi/actions';
import {
  XMessage,
  XMessageStatus,
  XTransaction,
  XTransactionInput,
  XTransactionStatus,
  XTransactionType,
} from '@/xwagmi/xcall/types';
import { xMessageActions } from '@/xwagmi/xcall/zustand/useXMessageStore';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { XChainId } from '@balancednetwork/sdk-core';
import { useSignTransaction } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { transactionActions } from './useTransactionStore';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { xChainHeightActions } from '@/xwagmi/xcall/zustand/useXChainHeightStore';

const iconChainId: XChainId = '0x1.icon';

const sendXTransaction = async (xTransactionInput: XTransactionInput, options: any) => {
  const { direction } = xTransactionInput;
  const sourceChainId = direction.from;

  const srcXWalletClient = getXWalletClient(sourceChainId);
  if (!srcXWalletClient) {
    throw new Error('WalletXService for source chain is not found');
  }

  console.log('xTransactionInput', xTransactionInput);

  const sourceTransactionHash = await srcXWalletClient.executeTransaction(xTransactionInput, options);
  if (!sourceTransactionHash) {
    return;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  let attributes = {};
  if (xTransactionInput.type === XTransactionType.BRIDGE) {
    const inputXToken = allXTokens.find(
      xToken => xToken.xChainId === direction.from && xToken.symbol === xTransactionInput.inputAmount.currency.symbol,
    );
    const outputXToken = allXTokens.find(
      xToken => xToken.xChainId === direction.to && xToken.symbol === xTransactionInput.inputAmount.currency.symbol,
    );
    const _inputAmount = xTransactionInput.inputAmount.toFixed();

    attributes = { inputXToken, outputXToken, inputAmount: _inputAmount, outputAmount: _inputAmount };
  } else if (
    xTransactionInput.type === XTransactionType.SWAP ||
    xTransactionInput.type === XTransactionType.SWAP_ON_ICON
  ) {
    const { executionTrade } = xTransactionInput;
    if (executionTrade) {
      const inputXToken = allXTokens.find(
        xToken => xToken.xChainId === direction.from && xToken.symbol === executionTrade.inputAmount.currency.symbol,
      );
      const outputXToken = allXTokens.find(
        xToken => xToken.xChainId === direction.to && xToken.symbol === executionTrade.outputAmount.currency.symbol,
      );
      const _inputAmount = executionTrade.inputAmount.toFixed();
      const _outputAmount = executionTrade.outputAmount.toFixed();
      attributes = { inputXToken, outputXToken, inputAmount: _inputAmount, outputAmount: _outputAmount };
    }
  } else if (xTransactionInput.type === XTransactionType.DEPOSIT) {
  } else if (xTransactionInput.type === XTransactionType.WITHDRAW) {
  } else if (xTransactionInput.type === XTransactionType.BORROW) {
  } else if (xTransactionInput.type === XTransactionType.REPAY) {
  }

  xTransactionInput?.callback?.();

  const sourceTransaction = transactionActions.add(sourceChainId, {
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
    attributes,
    createdAt: now,
  };
  xTransactionActions.add(xTransaction);

  if (xTransactionInput.type !== XTransactionType.SWAP_ON_ICON) {
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
      useXCallScanner: primaryDestinationChainId === 'sui' || sourceChainId === 'sui',
    };
    xMessageActions.add(xMessage);
  }

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
