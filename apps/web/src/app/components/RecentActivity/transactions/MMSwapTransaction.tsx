import useIntentProvider from '@/hooks/useIntentProvider';
import { intentService } from '@/lib/intent';
import { useOraclePrices } from '@/store/oracle/hooks';
import { MMTransaction, MMTransactionActions, MMTransactionStatus } from '@/store/transactions/useMMTransactionStore';
import { useElapsedTime } from '@/store/user/hooks';
import { formatRelativeTime } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XTransaction, xMessageActions } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import React, { useState } from 'react';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../../CurrencyLogoWithNetwork';
import TransactionStatusDisplay from './TransactionStatusDisplay';
import { Amount, Container, Details, ElapsedTime, Meta, Title } from './_styledComponents';

enum CancelStatus {
  None,
  Signing,
  AwaitingConfirmation,
  Success,
  Failed,
}

interface MMSwapTransactionProps {
  transaction: MMTransaction;
}

const MMSwapTransaction: React.FC<MMSwapTransactionProps> = ({ transaction }) => {
  const theme = useTheme();
  const { fromAmount, toAmount } = transaction;
  const prices = useOraclePrices();
  const [status, setStatus] = useState<CancelStatus>(CancelStatus.None);
  const { data: intentProvider } = useIntentProvider(transaction.fromAmount.currency.wrapped);
  // const primaryMessage = xMessageActions.getOf(transaction.id, true);

  const elapsedTime = useElapsedTime(transaction.createdAt);

  const handleCancel = async () => {
    setStatus(CancelStatus.Signing);
    try {
      if (intentProvider) {
        const result = await intentService.cancelIntentOrder(
          transaction.orderId,
          xChainMap[transaction.fromAmount.currency.xChainId].intentChainId,
          intentProvider,
        );

        if (result.ok) {
          MMTransactionActions.cancel(transaction.id);
          setStatus(CancelStatus.Success);
        } else {
          setStatus(CancelStatus.None);
        }
      }
    } catch (e) {
      console.error(e);
      setStatus(CancelStatus.None);
    }
  };

  return (
    <>
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
          <TransactionStatusDisplay status={transaction.status} />
          <ElapsedTime>{formatRelativeTime(elapsedTime)}</ElapsedTime>
        </Meta>
      </Container>
      {transaction.status === MMTransactionStatus.pending ? (
        <Flex paddingLeft="38px" marginBottom="-10px" width="100%" justifyContent="flex-end" alignItems="center">
          {status === CancelStatus.None && <CancelButton onClick={handleCancel}>Cancel</CancelButton>}
          {status === CancelStatus.Signing && <ElapsedTime>Signing...</ElapsedTime>}
          {status === CancelStatus.AwaitingConfirmation && <ElapsedTime>Canceling...</ElapsedTime>}
          {status === CancelStatus.Success && <ElapsedTime>Done</ElapsedTime>}
        </Flex>
      ) : null}
    </>
  );
};

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #fb6a6a;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
`;

export default MMSwapTransaction;
