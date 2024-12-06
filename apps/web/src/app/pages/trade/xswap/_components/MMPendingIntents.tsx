import React, { useMemo } from 'react';

import { EvmProvider, IntentService, SuiProvider } from '@balancednetwork/intents-sdk';
import { EvmXService, useXService } from '@balancednetwork/xwagmi';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import {
  MMTransaction,
  MMTransactionActions,
  MMTransactionStatus,
  useMMTransactionStore,
} from '@/store/transactions/useMMTransactionStore';

export default function MMPendingIntents({ intentId }: { intentId: string | null }) {
  const { transactions } = useMMTransactionStore();

  const pendingTxs = useMemo(() => {
    return Object.values(transactions)
      .filter(t => t.status === MMTransactionStatus.pending)
      .filter(t => t.id !== intentId);
  }, [transactions, intentId]);

  if (pendingTxs.length === 0) return null;

  return (
    <Flex justifyContent="center" flexDirection="column" paddingY={2} className="border-top" mt={3}>
      <Typography color="alert" textAlign="center" mb={1}>
        Pending transactions
      </Typography>

      {Object.values(pendingTxs).map(t => (
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

        // await settlement
        MMTransactionActions.cancel(transaction.id);
        setStatus(TransactionStatus.Success);
      } else {
        console.log('failed', result.error);
        setStatus(TransactionStatus.None);
      }
    } catch (e) {
      console.error(e);
      setStatus(TransactionStatus.Failed);
    }
  };

  return (
    <Flex justifyContent="center" alignItems="center" my={1}>
      <Typography textAlign="center">
        {`${transaction.fromAmount.toSignificant(6)} ${transaction.fromAmount.currency.symbol} for ${transaction.toAmount.toSignificant(6)} ${transaction.toAmount.currency.symbol}`}
      </Typography>{' '}
      |{' '}
      {status === TransactionStatus.None && <WarningUnderlineText onClick={handleCancel}>Cancel</WarningUnderlineText>}
      {status === TransactionStatus.Signing && <Typography>Signing...</Typography>}
      {status === TransactionStatus.AwaitingConfirmation && <Typography>Canceling...</Typography>}
      {status === TransactionStatus.Success && <Typography>Done</Typography>}
    </Flex>
  );
}
