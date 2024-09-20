import BigNumber from 'bignumber.js';

import { swapMessage } from '@/app/pages/trade/supply/_components/utils';
import { formatBigNumber } from '@/utils';
import { getXWalletClient } from '@/xwagmi/actions';
import { XChainId } from '@/xwagmi/types';
import {
  XMessage,
  XMessageStatus,
  XTransaction,
  XTransactionInput,
  XTransactionStatus,
  XTransactionType,
} from '@/xwagmi/xcall/types';
import { xMessageActions } from '@/xwagmi/xcall/zustand/useXMessageStore';
import { xServiceActions } from '@/xwagmi/xcall/zustand/useXServiceStore';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { useSignTransaction } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { transactionActions } from './useTransactionStore';

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

  let pendingMessage, successMessage, errorMessage;
  let descriptionAction, descriptionAmount;
  if (xTransactionInput.type === XTransactionType.BRIDGE) {
    pendingMessage = 'Requesting cross-chain transfer...';
    successMessage = 'Cross-chain transfer requested.';
    errorMessage = 'Cross-chain transfer failed.';

    const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');
    descriptionAction = `Transfer ${_tokenSymbol}`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
  } else if (xTransactionInput.type === XTransactionType.SWAP) {
    const { executionTrade } = xTransactionInput;
    if (executionTrade) {
      const _inputTokenSymbol = executionTrade?.inputAmount.currency.symbol || '';
      const _outputTokenSymbol = executionTrade?.outputAmount.currency.symbol || '';
      const _inputAmount = formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency');
      const _outputAmount = formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency');

      const swapMessages = swapMessage(
        _inputAmount,
        _inputTokenSymbol === '' ? 'IN' : _inputTokenSymbol,
        _outputAmount,
        _outputTokenSymbol === '' ? 'OUT' : _outputTokenSymbol,
      );

      pendingMessage = swapMessages.pendingMessage;
      successMessage = swapMessages.successMessage;
      errorMessage = 'Cross-chain swap failed.';
      descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
      descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
    }
  } else if (xTransactionInput.type === XTransactionType.DEPOSIT) {
    const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');
    pendingMessage = `Depositing ${_tokenSymbol} collateral...`;
    successMessage = `Deposited ${_formattedAmount} ${_tokenSymbol}.`;
    errorMessage = 'Collateral deposit failed.';

    descriptionAction = `Deposit ${_tokenSymbol} as collateral`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
  } else if (xTransactionInput.type === XTransactionType.WITHDRAW) {
    const _tokenSymbol = xTransactionInput.inputAmount.currency.symbol;
    const _formattedAmount = formatBigNumber(
      new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
      'currency',
    );
    pendingMessage = `Withdrawing ${_tokenSymbol} collateral...`;
    successMessage = `Withdrew ${_formattedAmount} ${_tokenSymbol}.`;
    errorMessage = 'Collateral withdrawal failed.';

    descriptionAction = `Withdraw ${_tokenSymbol} collateral`;
    descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
  } else if (xTransactionInput.type === XTransactionType.BORROW) {
    const _formattedAmount = formatBigNumber(new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0), 'currency');
    pendingMessage = 'Borrowing bnUSD...';
    successMessage = `Borrowed ${_formattedAmount} bnUSD.`;
    errorMessage = 'Borrow failed.';

    descriptionAction = `Borrow bnUSD`;
    descriptionAmount = `${_formattedAmount} bnUSD`;
  } else if (xTransactionInput.type === XTransactionType.REPAY) {
    const _formattedAmount = formatBigNumber(
      new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
      'currency',
    );
    pendingMessage = 'Repaying bnUSD...';
    successMessage = `Repaid ${_formattedAmount} bnUSD.`;
    errorMessage = 'Repay failed.';

    descriptionAction = `Repay bnUSD`;
    descriptionAmount = `${_formattedAmount} bnUSD`;
  }

  xTransactionInput?.callback?.();

  const sourceTransaction = transactionActions.add(sourceChainId, {
    hash: sourceTransactionHash,
    pendingMessage,
    successMessage,
    errorMessage,
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const finalDestinationChainId = direction.to;
  const primaryDestinationChainId = sourceChainId === iconChainId ? finalDestinationChainId : iconChainId;

  // biome-ignore lint/correctness/noConstantCondition: <explanation>
  if (true || direction.to === 'sui') {
    const xTransaction: XTransaction = {
      id: `${sourceChainId}/${sourceTransactionHash}`,
      type: xTransactionInput.type,
      status: XTransactionStatus.pending,
      secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
      sourceChainId: sourceChainId,
      finalDestinationChainId: finalDestinationChainId,
      finalDestinationChainInitialBlockHeight: 0n,
      attributes: {
        descriptionAction,
        descriptionAmount,
      },
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
      destinationChainInitialBlockHeight: 0n,
      isPrimary: true,
      useXCallScanner: true,
      createdAt: Date.now(),
    };

    xMessageActions.add(xMessage);

    return xTransaction.id;
  } else {
    const primaryDestinationChainInitialBlockHeight = xServiceActions.getXChainHeight(primaryDestinationChainId) - 20n;
    const finalDestinationChainInitialBlockHeight = xServiceActions.getXChainHeight(finalDestinationChainId);

    const xTransaction: XTransaction = {
      id: `${sourceChainId}/${sourceTransaction.hash}`,
      type: xTransactionInput.type,
      status: XTransactionStatus.pending,
      secondaryMessageRequired: primaryDestinationChainId !== finalDestinationChainId,
      sourceChainId: sourceChainId,
      finalDestinationChainId: finalDestinationChainId,
      finalDestinationChainInitialBlockHeight,
      attributes: {
        descriptionAction,
        descriptionAmount,
      },
    };

    xTransactionActions.add(xTransaction);

    const xMessage: XMessage = {
      id: `${sourceChainId}/${sourceTransaction.hash}`,
      xTransactionId: xTransaction.id,
      sourceChainId: sourceChainId,
      destinationChainId: primaryDestinationChainId,
      // @ts-ignore
      sourceTransactionHash,

      status: XMessageStatus.REQUESTED,
      events: {},
      destinationChainInitialBlockHeight: primaryDestinationChainInitialBlockHeight,
      isPrimary: true,
      createdAt: Date.now(),
    };

    xMessageActions.add(xMessage);

    return xTransaction.id;
  }
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
