import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { Transaction, XTransaction } from '@balancednetwork/xwagmi';
import React, { useMemo } from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface SwapTransactionProps {
  transaction: XTransaction | Transaction;
}

const SwapTransaction: React.FC<SwapTransactionProps> = ({ transaction }) => {
  const theme = useTheme();

  // Add null checks for input and its properties
  const input = transaction?.input;
  const inputXToken = input?.inputAmount?.currency;
  const outputXToken = input?.outputAmount?.currency;

  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);

  const elapsedTime = useElapsedTime(transaction?.createdAt);

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
          {input.inputAmount &&
            formatBalance(input.inputAmount.toExact(), prices?.[inputXToken.symbol]?.toFixed() || 1)}{' '}
          {inputXToken.symbol} for{' '}
          {input.outputAmount &&
            formatBalance(input.outputAmount.toExact(), prices[outputXToken.symbol]?.toFixed() || 1)}{' '}
          {outputXToken.symbol}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default SwapTransaction;
