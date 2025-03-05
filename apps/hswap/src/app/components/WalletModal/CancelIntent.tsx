import React from 'react';

import { EvmXService, useCurrentAccount, useCurrentWallet, useSuiClient, useXService } from '@balancednetwork/xwagmi';
import { EvmProvider, SuiProvider } from 'icon-intents-sdk';

import { intentService } from '@/lib/intent';
import { MMTransaction, MMTransactionActions } from '@/store/transactions/useMMTransactionStore';

enum TransactionStatus {
  None,
  Signing,
  AwaitingConfirmation,
  Success,
  Failed,
}

function CancelIntent({ transaction }: { transaction: MMTransaction }) {
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
    console.log('cancel', transaction);
    const walletClient = await xService.getWalletClient(transaction.fromAmount.currency.chainId);
    const publicClient = xService.getPublicClient(transaction.fromAmount.currency.chainId);

    setStatus(TransactionStatus.Signing);
    try {
      const result = await intentService.cancelIntentOrder(
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
    <div className="flex items-center justify-center my-1">
      {status === TransactionStatus.None && (
        <span
          className="text-[#0d0229] text-[10px] font-bold uppercase hover:underline cursor-pointer"
          onClick={handleCancel}
        >
          Cancel
        </span>
      )}
      {status === TransactionStatus.Signing && (
        <span className="text-[#0d0229] text-[10px] font-bold uppercase hover:underline cursor-pointer">
          Signing...
        </span>
      )}
      {status === TransactionStatus.AwaitingConfirmation && (
        <span className="text-[#0d0229] text-[10px] font-bold uppercase hover:underline cursor-pointer">
          Canceling...
        </span>
      )}
      {status === TransactionStatus.Success && (
        <span className="text-[#0d0229] text-[10px] font-bold uppercase hover:underline cursor-pointer">Done</span>
      )}
    </div>
  );
}

export default CancelIntent;
