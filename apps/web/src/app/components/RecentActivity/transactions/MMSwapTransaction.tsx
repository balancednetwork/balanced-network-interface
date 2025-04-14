import { useOraclePrices } from '@/store/oracle/hooks';
import { MMTransaction } from '@/store/transactions/useMMTransactionStore';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XTransaction, xMessageActions } from '@balancednetwork/xwagmi';
import React from 'react';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatus from './TransactionStatus';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface MMSwapTransactionProps {
  transaction: MMTransaction;
}

const MMSwapTransaction: React.FC<MMSwapTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const { fromAmount, toAmount } = transaction;
  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);

  const elapsedTime = useElapsedTime(transaction.createdAt);

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={fromAmount.currency}
        chainId={fromAmount.currency.xChainId}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        <Title>
          Swap {formatSymbol(fromAmount.currency.symbol)} for {formatSymbol(toAmount.currency.symbol)}
        </Title>
        <Amount>
          {formatBalance(fromAmount.toFixed(), prices?.[fromAmount.currency.symbol]?.toFixed() || 1)}{' '}
          {formatSymbol(fromAmount.currency.symbol)} for{' '}
          {formatBalance(toAmount.toFixed(), prices[toAmount.currency.address]?.toFixed() || 1)}{' '}
          {formatSymbol(toAmount.currency.symbol)}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatus status={transaction.status} />
        {transaction.status === 'pending' ? <>cancel</> : <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>}
      </Meta>
    </Container>
  );
};

export default MMSwapTransaction;
