import { useOraclePrices } from '@/store/oracle/hooks';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance } from '@/utils/formatter';
import { XTransaction, XTransactionStatus, xChainMap } from '@balancednetwork/xwagmi';
import React, { useMemo } from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { ElapsedTime } from './_styledComponents';
import { Amount, Meta, Title } from './_styledComponents';
import { Container, Details } from './_styledComponents';

interface RewardsSavingsTransactionProps {
  transaction: XTransaction;
}

const RewardsSavingsTransaction: React.FC<RewardsSavingsTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const inputXToken = transaction.input.inputAmount.currency;
  const inputAmount = transaction.input.inputAmount.toFixed();
  const prices = useOraclePrices();

  console.log('rewards tx', transaction);

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
        <Title>Claim savings rewards </Title>
        {/* <Amount>
          {formatBalance(inputAmount, prices?.[inputXToken.symbol]?.toFixed() || 1)} {inputXToken.symbol} to{' '}
          {xChainMap[destination]?.name}
        </Amount> */}
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default RewardsSavingsTransaction;
