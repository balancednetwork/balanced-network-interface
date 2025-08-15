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

interface DepositXTokenTransactionProps {
  transaction: XTransaction;
}

const DepositXTokenTransaction: React.FC<DepositXTokenTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const input = transaction?.input;
  const inputXToken = input?.inputAmount?.currency;
  const prices = useOraclePrices();
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isDeposit = transaction.type === XTransactionType.LP_DEPOSIT_XTOKEN;

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={inputXToken}
        chainId={inputXToken?.xChainId}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        <Title>
          {isDeposit ? 'Supply' : 'Withdraw'} {formatSymbol(inputXToken?.symbol)}{' '}
        </Title>
        <Amount>
          {input?.inputAmount &&
            formatBalance(input.inputAmount.toExact(), prices?.[inputXToken?.symbol]?.toFixed() || 1)}{' '}
          {inputXToken?.symbol}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default DepositXTokenTransaction;
