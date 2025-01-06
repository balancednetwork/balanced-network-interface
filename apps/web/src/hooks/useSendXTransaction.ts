import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { formatBigNumber } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import {
  XChainId,
  XMessage,
  XMessageStatus,
  XTransaction,
  XTransactionInput,
  XTransactionStatus,
  XTransactionType,
  getXWalletClient,
  transactionActions,
  useSignTransaction,
  xChainHeightActions,
  xChainMap,
  xMessageActions,
  xTransactionActions,
} from '@balancednetwork/xwagmi';

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
  let descriptionAction, descriptionAmount;
  let attributes;
  if (xTransactionInput.type === XTransactionType.BRIDGE) {
    const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');
    descriptionAction = `Transfer ${_tokenSymbol}`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;

    attributes = { descriptionAction, descriptionAmount };
  } else if (xTransactionInput.type === XTransactionType.SWAP) {
    const { executionTrade } = xTransactionInput;
    if (executionTrade) {
      const _inputTokenSymbol = formatSymbol(executionTrade?.inputAmount.currency.symbol) || '';
      const _outputTokenSymbol = formatSymbol(executionTrade?.outputAmount.currency.symbol) || '';
      const _inputAmount = formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency');
      const _outputAmount = formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency');

      descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
      descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
    }

    attributes = { descriptionAction, descriptionAmount };
  } else if (xTransactionInput.type === XTransactionType.DEPOSIT) {
    const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');

    descriptionAction = `Deposit ${_tokenSymbol} as collateral`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;

    attributes = { descriptionAction, descriptionAmount };
  } else if (xTransactionInput.type === XTransactionType.WITHDRAW) {
    const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
    const _formattedAmount = formatBigNumber(
      new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
      'currency',
    );

    descriptionAction = `Withdraw ${_tokenSymbol} collateral`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;

    attributes = { descriptionAction, descriptionAmount };
  } else if (xTransactionInput.type === XTransactionType.BORROW) {
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');

    descriptionAction = `Borrow bnUSD`;
    descriptionAmount = `${_formattedAmount} bnUSD`;

    attributes = { descriptionAction, descriptionAmount };
  } else if (xTransactionInput.type === XTransactionType.REPAY) {
    const _formattedAmount = formatBigNumber(
      new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
      'currency',
    );

    descriptionAction = `Repay bnUSD`;
    descriptionAmount = `${_formattedAmount} bnUSD`;

    attributes = {
      descriptionAction,
      descriptionAmount,
      collateralChainId: xTransactionInput.recipient?.split('/')?.[0],
    };
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
    attributes,
    createdAt: now,
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
