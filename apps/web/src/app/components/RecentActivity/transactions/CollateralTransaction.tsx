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

interface CollateralTransactionProps {
  transaction: XTransaction;
}

const CollateralTransaction: React.FC<CollateralTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const input = transaction.input;
  const prices = useOraclePrices();
  const inputXToken = input?.inputAmount?.currency;
  const inputAmount = input?.inputAmount;
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isDeposit =
    transaction.type === XTransactionType.DEPOSIT || transaction.type === XTransactionType.DEPOSIT_ON_ICON;
  const isICON =
    transaction.type === XTransactionType.WITHDRAW_ON_ICON || transaction.type === XTransactionType.DEPOSIT_ON_ICON;

  return (
    <Container>
      <CurrencyLogoWithNetwork
        currency={inputXToken}
        chainId={isICON ? '0x1.icon' : inputXToken.xChainId}
        bgColor={theme.colors.bg2}
        size="26px"
      />
      <Details>
        <Title>
          {isDeposit ? 'Deposit' : 'Withdraw'} {formatSymbol(inputXToken.symbol)} collateral
        </Title>
        <Amount>
          {inputAmount &&
            formatBalance(
              inputAmount.multiply(isDeposit ? 1 : -1).toExact(),
              prices?.[inputXToken.symbol]?.toFixed() || 1,
            )}{' '}
          {formatSymbol(inputXToken.symbol)}
        </Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default CollateralTransaction;
