import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XTransaction, XTransactionType } from '@balancednetwork/xwagmi';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import PoolLogoWithNetwork from '../../PoolLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface LPTransactionProps {
  transaction: XTransaction;
}

const LPTransaction: React.FC<LPTransactionProps> = ({ transaction }) => {
  const input = transaction?.input;
  const prices = useOraclePrices();
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isWithdraw = transaction.type === XTransactionType.LP_REMOVE_LIQUIDITY;

  const tokenAmountA = isWithdraw ? input?.withdrawAmountA : input?.inputAmount;
  const tokenAmountB = isWithdraw ? input?.withdrawAmountB : input?.outputAmount;

  return (
    <Container>
      {tokenAmountA && tokenAmountB ? (
        <PoolLogoWithNetwork
          compactVersion={true}
          chainId={transaction.sourceChainId}
          baseCurrency={tokenAmountA.currency}
          quoteCurrency={tokenAmountB.currency}
        />
      ) : null}
      <Details>
        <Title>{`${isWithdraw ? 'Withdraw' : 'Supply'} ${formatSymbol(tokenAmountA?.currency.symbol)} / ${formatSymbol(tokenAmountB?.currency.symbol)}`}</Title>

        <Amount>
          {formatBalance(tokenAmountA?.toExact(), prices?.[tokenAmountA?.currency.symbol]?.toFixed() || 1)}{' '}
          {formatSymbol(tokenAmountA?.currency.symbol)}
          {' / '}
          {formatBalance(tokenAmountB?.toExact(), prices?.[tokenAmountB?.currency.symbol]?.toFixed() || 1)}{' '}
          {formatSymbol(tokenAmountB?.currency.symbol)}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default LPTransaction;
