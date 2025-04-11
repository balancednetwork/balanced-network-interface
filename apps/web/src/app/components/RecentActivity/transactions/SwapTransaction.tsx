import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { XTransaction, xMessageActions } from '@balancednetwork/xwagmi';
import React from 'react';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import { Amount, Container, Details, ElapsedTime, Meta, Status, Title } from './_styledComponents';

interface SwapTransactionProps {
  transaction: XTransaction;
}

const SwapTransaction: React.FC<SwapTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const inputXToken = transaction.input.inputAmount.currency;
  const outputXToken = transaction.input?.outputAmount!.currency;
  const inputAmount = transaction.input.inputAmount.toFixed();
  const outputAmount = transaction.input?.outputAmount!.toFixed();
  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);

  const elapsedTime = useElapsedTime(transaction.createdAt);

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
          {formatBalance(inputAmount, prices?.[inputXToken.symbol]?.toFixed() || 1)} {inputXToken.symbol} for{' '}
          {formatBalance(outputAmount, prices[outputXToken.address]?.toFixed() || 1)} {outputXToken.symbol}
        </Amount>
      </Details>
      <Meta>
        <Status>Completed</Status>
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default SwapTransaction;
