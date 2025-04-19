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

interface LPStakeTransactionProps {
  transaction: XTransaction;
}

const LPStakeTransaction: React.FC<LPStakeTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const input = transaction?.input;
  const inputXToken = input?.inputAmount?.currency;
  const symbolA = input?.tokenASymbol;
  const symbolB = input?.tokenBSymbol;
  const elapsedTime = useElapsedTime(transaction?.createdAt);

  const isStake = transaction.type === XTransactionType.LP_STAKE;

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
          {isStake ? 'Stake' : 'Unstake'} {formatSymbol(symbolA)} / {formatSymbol(symbolB)}
        </Title>
        <Amount>{input.inputAmount && input.inputAmount.toSignificant(5)} LP</Amount>
      </Details>
      <Meta>
        <TransactionStatusDisplay status={transaction.status} />
        <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
      </Meta>
    </Container>
  );
};

export default LPStakeTransaction;
