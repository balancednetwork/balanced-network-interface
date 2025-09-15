import React, { useMemo } from 'react';

import {
  EvmXService,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useXService,
  xChainMap,
} from '@balancednetwork/xwagmi';
import { EvmProvider, SuiProvider } from 'icon-intents-sdk';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import useIntentProvider from '@/hooks/useIntentProvider';
import { useSignedInWallets } from '@/hooks/useWallets';
import { intentService } from '@/lib/intent';
import { useRatesWithOracle } from '@/queries/reward';
import {
  MMTransaction,
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useMMTransactionStore';
import { formatBalance, formatSymbol } from '@/utils/formatter';

export default function MMPendingIntents() {
  const { transactions } = useMMTransactionStore();
  const signedWallets = useSignedInWallets();

  const pendingIntents = useMemo(() => {
    return Object.values(transactions)
      .filter(t => t.status === MMTransactionStatus.pending)
      .filter(t => !t.executor || !!signedWallets.find(w => w.address.toLowerCase() === t.executor.toLowerCase()));
  }, [transactions, signedWallets]);

  if (pendingIntents.length === 0) return null;

  return (
    <Flex justifyContent="center" flexDirection="column" paddingY={2} marginX={-3}>
      {pendingIntents.map(t => (
        <PendingIntent key={t.id} transaction={t} />
      ))}
    </Flex>
  );
}

const WarningUnderlineText = styled(UnderlineText)`
  font-size: 14px;
  color: #fb6a6a;

  ${({ theme }) => theme.mediaWidth.upMedium`
    &:hover:after {
    width: 100%;
    background: #fb6a6a;
  }
  `};
`;

enum TransactionStatus {
  None,
  Signing,
  AwaitingConfirmation,
  Success,
  Failed,
}

function PendingIntent({ transaction }: { transaction: MMTransaction }) {
  const rates = useRatesWithOracle();

  const { data: intentProvider } = useIntentProvider(transaction.fromAmount.currency.wrapped);

  const [status, setStatus] = React.useState<TransactionStatus>(TransactionStatus.None);

  const handleCancel = async () => {
    setStatus(TransactionStatus.Signing);
    try {
      if (intentProvider) {
        const result = await intentService.cancelIntentOrder(
          transaction.orderId,
          xChainMap[transaction.fromAmount.currency.xChainId].intentChainId,
          intentProvider,
        );

        if (result.ok) {
          MMTransactionActions.cancel(transaction.id);
          setStatus(TransactionStatus.Success);
        } else {
          setStatus(TransactionStatus.None);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Flex justifyContent="center" alignItems="center" my={1} as="p">
      <Typography textAlign="center">
        <strong>
          {formatBalance(transaction.fromAmount.toFixed(), rates?.[transaction.fromAmount.currency.symbol]?.toFixed())}{' '}
          {formatSymbol(transaction.fromAmount.currency.symbol)}
        </strong>{' '}
        for{' '}
        <strong>
          {formatBalance(transaction.toAmount.toFixed(), rates?.[transaction.toAmount.currency.symbol]?.toFixed())}{' '}
          {formatSymbol(transaction.toAmount.currency.symbol)}
        </strong>
      </Typography>{' '}
      |{' '}
      {status === TransactionStatus.None && <WarningUnderlineText onClick={handleCancel}>Cancel</WarningUnderlineText>}
      {status === TransactionStatus.Signing && <Typography>Signing</Typography>}
      {status === TransactionStatus.AwaitingConfirmation && <Typography>Canceling</Typography>}
      {status === TransactionStatus.Success && <Typography>Done</Typography>}
    </Flex>
  );
}
