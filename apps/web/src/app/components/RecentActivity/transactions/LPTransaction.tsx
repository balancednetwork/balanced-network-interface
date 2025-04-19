import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XTransaction, XTransactionType } from '@balancednetwork/xwagmi';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface LPTransactionProps {
  transaction: XTransaction;
}

const LPTransaction: React.FC<LPTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const input = transaction?.input;
  const inputXToken = input?.inputAmount?.currency;
  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isWithdraw = transaction.type === XTransactionType.LP_REMOVE_LIQUIDITY;

  const withdrawAmountA = input?.withdrawAmountA;
  const withdrawAmountB = input?.withdrawAmountB;

  const addAmountA = input?.inputAmount;
  const addAmountB = input?.outputAmount;

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={inputXToken}
        chainId={inputXToken.xChainId}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        {isWithdraw ? (
          <Title>{`Withdraw ${formatSymbol(withdrawAmountA?.currency.symbol)} / ${formatSymbol(withdrawAmountB?.currency.symbol)}`}</Title>
        ) : (
          <Title>{`Supply ${formatSymbol(addAmountA?.currency.symbol)} / ${formatSymbol(addAmountB?.currency.symbol)}`}</Title>
        )}

        {isWithdraw ? (
          <Amount>
            {formatBalance(withdrawAmountA?.toExact(), prices?.[withdrawAmountA?.currency.symbol]?.toFixed() || 1)}{' '}
            {withdrawAmountA?.currency.symbol}
            {' / '}
            {formatBalance(withdrawAmountB?.toExact(), prices?.[withdrawAmountB?.currency.symbol]?.toFixed() || 1)}{' '}
            {withdrawAmountB?.currency.symbol}
          </Amount>
        ) : (
          <Amount>
            {formatBalance(addAmountA?.toExact(), prices?.[addAmountA?.currency.symbol]?.toFixed() || 1)}{' '}
            {addAmountA?.currency.symbol}
            {' / '}
            {formatBalance(addAmountB?.toExact(), prices?.[addAmountB?.currency.symbol]?.toFixed() || 1)}{' '}
            {addAmountB?.currency.symbol}
          </Amount>
        )}
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default LPTransaction;
