import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Transaction, TransactionStatus as TxStatus, XTransaction, xMessageActions } from '@balancednetwork/xwagmi';
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatus from './TransactionStatus';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface SwapTransactionProps {
  transaction: XTransaction | Transaction;
}

const SwapTransaction: React.FC<SwapTransactionProps> = ({ transaction }) => {
  const theme = useTheme();

  // Add null checks for input and its properties
  const inputXToken = transaction?.input?.inputAmount?.currency;
  const outputXToken = transaction?.input?.outputAmount?.currency;

  // Get raw numeric values
  const rawInputAmount = transaction?.input?.inputAmount?.quotient?.toString();
  const rawOutputAmount = transaction?.input?.outputAmount?.quotient?.toString();

  // Reconstruct CurrencyAmount objects if we have the raw data
  const inputAmount = useMemo(() => {
    if (!rawInputAmount || !inputXToken) return null;
    try {
      return CurrencyAmount.fromRawAmount(inputXToken, rawInputAmount);
    } catch (e) {
      console.error('Failed to reconstruct input amount:', e);
      return null;
    }
  }, [rawInputAmount, inputXToken]);

  const outputAmount = useMemo(() => {
    if (!rawOutputAmount || !outputXToken) return null;
    try {
      return CurrencyAmount.fromRawAmount(outputXToken, rawOutputAmount);
    } catch (e) {
      console.error('Failed to reconstruct output amount:', e);
      return null;
    }
  }, [rawOutputAmount, outputXToken]);

  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);

  const elapsedTime = useElapsedTime(transaction?.createdAt);

  // Map transaction status to display status
  const displayStatus = useMemo(() => {
    if (!transaction?.status) return 'pending';
    switch (transaction.status) {
      case TxStatus.pending:
        return 'pending';
      case TxStatus.success:
        return 'completed';
      case TxStatus.failure:
        return 'failed';
      default:
        return 'pending';
    }
  }, [transaction?.status]);

  // Guard against missing data
  if (!inputXToken || !outputXToken) {
    return null;
  }

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={inputXToken}
        chainId={inputXToken.xChainId}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        <Title>
          Swap {inputXToken.symbol} for {outputXToken.symbol}
        </Title>
        <Amount>
          {inputAmount && formatBalance(inputAmount.toExact(), prices?.[inputXToken.symbol]?.toFixed() || 1)}{' '}
          {inputXToken.symbol} for{' '}
          {outputAmount && formatBalance(outputAmount.toExact(), prices[outputXToken.address]?.toFixed() || 1)}{' '}
          {outputXToken.symbol}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatus status={displayStatus} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default SwapTransaction;
