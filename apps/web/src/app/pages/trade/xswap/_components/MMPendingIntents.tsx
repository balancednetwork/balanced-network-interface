import React, { useMemo } from 'react';

import { EvmProvider, IntentService, SuiProvider } from '@balancednetwork/intents-sdk';
import { EvmXService, useCurrentAccount, useCurrentWallet, useSuiClient, useXService } from '@balancednetwork/xwagmi';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import {
  MMTransaction,
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useMMTransactionStore';
import { formatBalance } from '@/utils/formatter';

export default function MMPendingIntents() {
  const { transactions } = useMMTransactionStore();

  const pendingIntents = useMemo(() => {
    return Object.values(transactions).filter(t => t.status === MMTransactionStatus.pending);
  }, [transactions]);

  if (pendingIntents.length === 0) return null;

  return (
    <Flex justifyContent="center" flexDirection="column" paddingY={2}>
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

  const [status, setStatus] = React.useState<TransactionStatus>(TransactionStatus.None);
  // arb part
  const xService = useXService('EVM') as unknown as EvmXService;
  // end arb part

  // sui part
  const suiClient = useSuiClient();
  const { currentWallet: suiWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  // end sui part

  const handleCancel = async () => {
    const walletClient = await xService.getWalletClient(transaction.fromAmount.currency.chainId);
    const publicClient = xService.getPublicClient(transaction.fromAmount.currency.chainId);

    setStatus(TransactionStatus.Signing);
    try {
      const result = await IntentService.cancelIntentOrder(
        transaction.orderId,
        transaction.fromAmount.currency.xChainId === '0xa4b1.arbitrum' ? 'arb' : 'sui',
        transaction.fromAmount.currency.xChainId === '0xa4b1.arbitrum'
          ? // @ts-ignore
            new EvmProvider({ walletClient: walletClient, publicClient: publicClient })
          : // @ts-ignore
            new SuiProvider({ client: suiClient, wallet: suiWallet, account: suiAccount }),
      );

      if (result.ok) {
        setStatus(TransactionStatus.AwaitingConfirmation);

        const waitForTransaction = async () => {
          if (transaction.fromAmount.currency.xChainId === '0xa4b1.arbitrum') {
            return publicClient.waitForTransactionReceipt({ hash: result.value as `0x${string}` });
          } else {
            return suiClient.waitForTransaction({
              digest: result.value,
              options: {
                showEffects: false,
                showEvents: true,
              },
            });
          }
        };

        await waitForTransaction();
        // await settlement
        MMTransactionActions.cancel(transaction.id);
        setStatus(TransactionStatus.Success);
      } else {
        setStatus(TransactionStatus.None);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Flex justifyContent="center" alignItems="center" my={1}>
      <Typography textAlign="center">
        <strong>
          {formatBalance(transaction.fromAmount.toFixed(), rates?.[transaction.fromAmount.currency.symbol].toFixed())}{' '}
          {transaction.fromAmount.currency.symbol}
        </strong>{' '}
        for{' '}
        <strong>
          {formatBalance(transaction.toAmount.toFixed(), rates?.[transaction.toAmount.currency.symbol].toFixed())}{' '}
          {transaction.toAmount.currency.symbol}
        </strong>
      </Typography>{' '}
      |{' '}
      {status === TransactionStatus.None && <WarningUnderlineText onClick={handleCancel}>Cancel</WarningUnderlineText>}
      {status === TransactionStatus.Signing && <Typography>Signing...</Typography>}
      {status === TransactionStatus.AwaitingConfirmation && <Typography>Canceling...</Typography>}
      {status === TransactionStatus.Success && <Typography>Done</Typography>}
    </Flex>
  );
}
