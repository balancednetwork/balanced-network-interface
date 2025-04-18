import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XChainId, XTransaction, XTransactionType } from '@balancednetwork/xwagmi';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

interface LoanTransactionProps {
  transaction: XTransaction;
}

const LoanTransaction: React.FC<LoanTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const input = transaction.input;
  const inputXToken = input?.inputAmount?.currency;
  const inputAmount = input?.inputAmount;
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isBorrow = transaction.type === XTransactionType.BORROW || transaction.type === XTransactionType.BORROW_ON_ICON;

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={inputXToken}
        chainId={isBorrow ? input.direction.to : input.direction.from}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        <Title>
          {isBorrow ? 'Borrow' : 'Repay'}
          {' bnUSD'}
        </Title>
        <Amount>
          {inputAmount && formatBalance(inputAmount.multiply(inputAmount.lessThan(0) ? -1 : 1).toExact(), 1)}
          {' bnUSD'}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default LoanTransaction;
