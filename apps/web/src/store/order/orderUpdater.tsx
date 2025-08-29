import { useStatus } from '@sodax/dapp-kit';
import { Hex } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import React from 'react';
import { toast } from 'react-toastify';

import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { NotificationSuccess, NotificationError } from '@/app/components/Notification/TransactionNotification';
import { Order, useOrderStore } from './useOrderStore';
import { getTokenDataFromIntent } from '@/app/components/RecentActivity/transactions/IntentSwap';
import { useOraclePrices } from '@/store/oracle/hooks';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { toBigIntSafe } from '@/app/components/RecentActivity/transactions/IntentSwap';

// Individual component for each order to safely use the useStatus hook
const OrderStatusUpdater: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrderStatus } = useOrderStore();
  const { data: status } = useStatus(
    typeof order.packet.dstTxHash === 'string' ? (order.packet.dstTxHash as Hex) : ('' as Hex),
  );
  const sonicScanLink = `https://sonicscan.org/tx/${order.packet.dstTxHash}`;
  const tokensData = getTokenDataFromIntent(order.intent);
  const prices = useOraclePrices();

  React.useEffect(() => {
    if (status) {
      if (status.ok) {
        // Map sodax status to our unified status
        let newStatus: UnifiedTransactionStatus | null = null;

        switch (status.value.status) {
          case SolverIntentStatusCode.SOLVED:
            newStatus = UnifiedTransactionStatus.success;
            break;
          case SolverIntentStatusCode.FAILED:
            newStatus = UnifiedTransactionStatus.failed;
            break;
          default:
            //todo: probably handle "NOT_FOUND" specifically
            // Keep as pending for other statuses (NOT_FOUND, NOT_STARTED_YET, STARTED_NOT_FINISHED)
            newStatus = null;
            break;
        }

        // Only update if status has changed and we have a new status
        if (newStatus && order.status !== newStatus) {
          updateOrderStatus(order.intentHash, newStatus);

          // Show toast notification based on status
          if (newStatus === UnifiedTransactionStatus.success) {
            // Format amounts for the notification
            const inputAmount = CurrencyAmount.fromRawAmount(
              tokensData?.srcToken!,
              toBigIntSafe(order.intent.inputAmount),
            );
            const outputAmount = CurrencyAmount.fromRawAmount(
              tokensData?.dstToken!,
              toBigIntSafe(order.intent.minOutputAmount),
            );

            const inputAmountFormatted = formatBalance(
              inputAmount.toFixed(),
              prices?.[inputAmount.currency.symbol]?.toFixed() || 1,
            );
            const outputAmountFormatted = formatBalance(
              outputAmount.toFixed(),
              prices?.[outputAmount.currency.symbol]?.toFixed() || 1,
            );

            toast(
              <NotificationSuccess
                sonicScanLink={sonicScanLink}
                summary={`Swapped ${inputAmountFormatted} ${formatSymbol(inputAmount.currency.symbol)} for ${outputAmountFormatted} ${formatSymbol(outputAmount.currency.symbol)}`}
              />,
              {
                toastId: order.intentHash,
                autoClose: 3000,
                onClick: () => window.open(sonicScanLink, '_blank'),
              },
            );
          } else if (newStatus === UnifiedTransactionStatus.failed) {
            // Format amounts for the failure notification
            const inputAmount = CurrencyAmount.fromRawAmount(
              tokensData?.srcToken!,
              toBigIntSafe(order.intent.inputAmount),
            );

            const inputAmountFormatted = formatBalance(
              inputAmount.toFixed(),
              prices?.[inputAmount.currency.symbol]?.toFixed() || 1,
            );

            toast(
              <NotificationError
                failureReason={`${inputAmountFormatted} ${formatSymbol(inputAmount.currency.symbol)} for ${tokensData?.dstToken?.symbol} order failed. `}
                sonicScanLink={sonicScanLink}
              />,
              {
                toastId: order.intentHash,
                autoClose: 3000,
              },
            );
          }
        }
      } else {
        // Handle error case
        if (order.status !== UnifiedTransactionStatus.failed) {
          updateOrderStatus(order.intentHash, UnifiedTransactionStatus.failed);

          // Show failure toast
          const inputAmount = CurrencyAmount.fromRawAmount(
            tokensData?.srcToken!,
            toBigIntSafe(order.intent.inputAmount),
          );

          const inputAmountFormatted = formatBalance(
            inputAmount.toFixed(),
            prices?.[inputAmount.currency.symbol]?.toFixed() || 1,
          );

          toast(
            <NotificationError
              failureReason={`${inputAmountFormatted} ${formatSymbol(inputAmount.currency.symbol)} for ${tokensData?.dstToken?.symbol} order failed. `}
              sonicScanLink={sonicScanLink}
            />,
            {
              toastId: order.intentHash,
              autoClose: 3000,
            },
          );
        }
      }
    }
  }, [status, order, updateOrderStatus, tokensData, sonicScanLink, prices]);

  return null;
};

export default function OrderUpdater(): JSX.Element {
  const { orders } = useOrderStore();

  // Filter orders that are still pending
  const pendingOrders = orders.filter(order => order.status === UnifiedTransactionStatus.pending);

  return (
    <>
      {pendingOrders.map(order => (
        <OrderStatusUpdater key={order.intentHash} order={order} />
      ))}
    </>
  );
}
