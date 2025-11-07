import { useStatus } from '@sodax/dapp-kit';
import {
  DEFAULT_RELAY_TX_TIMEOUT,
  Hex,
  IntentError,
  PacketData,
  Result,
  SpokeChainId,
  getIntentRelayChainId,
  waitUntilIntentExecuted,
} from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import React from 'react';
import { toast } from 'react-toastify';

import { NotificationError, NotificationSuccess } from '@/app/components/Notification/TransactionNotification';
import { getTokenDataFromIntent } from '@/app/components/RecentActivity/transactions/IntentSwap';
import { toBigIntSafe } from '@/app/components/RecentActivity/transactions/IntentSwap';
import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import sodaxConfig from '@/lib/sodax';
import { useOraclePrices } from '@/store/oracle/hooks';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { Order, useOrderStore } from './useOrderStore';

/**
 * Get the intent delivery info about solved intent from the Relayer API
 * @param {SpokeChainId} chainId - The destination spoke chain ID
 * @param {string} fillTxHash - The fill transaction hash (received from getStatus when status is 3 - SOLVED)
 * @param {number} timeout - The timeout in milliseconds (default: 120 seconds)
 * @returns {Promise<IntentDeliveryInfo>} The intent delivery info
 */

// async function getSolvedIntentPacket({
//   chainId,
//   fillTxHash,
//   timeout = DEFAULT_RELAY_TX_TIMEOUT, // use your default timeout
// }: { chainId: SpokeChainId; fillTxHash: string; timeout?: number }): Promise<
//   Result<PacketData, IntentError<'RELAY_TIMEOUT'>>
// > {
//   return waitUntilIntentExecuted({
//     intentRelayChainId: getIntentRelayChainId(chainId).toString(),
//     spokeTxHash: fillTxHash,
//     timeout,
//     apiUrl: sodaxConfig.relayerApiEndpoint,
//   });
// }

// (async () => {
//   const intentDeliveryInfo = await getSolvedIntentPacket({
//     chainId: '0xa4b1.arbitrum',
//     fillTxHash: '0xb4d8265dffe331e2163b77d1a8bb08ec14663989807d1efa8067d4e46e0cbc5d',
//   });

//   console.log('intentDeliveryInfo', intentDeliveryInfo);
// })();

// Individual component for each order to safely use the useStatus hook
const OrderStatusUpdater: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrderStatus, updateOrderDstTxHash } = useOrderStore();
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
            // Check if tokens are available before creating CurrencyAmount
            if (tokensData?.srcToken && tokensData?.dstToken) {
              // Format amounts for the notification
              const inputAmount = CurrencyAmount.fromRawAmount(
                tokensData.srcToken,
                toBigIntSafe(order.intent.inputAmount),
              );
              const outputAmount = CurrencyAmount.fromRawAmount(
                tokensData.dstToken,
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

              // if (status.value.fill_tx_hash) {
              //   (async () => {
              //     const intentDeliveryInfo = await getSolvedIntentPacket({
              //       chainId: order.packet.dstChainId,
              //       fillTxHash: status.value.fill_tx_hash as string,
              //     });

              //     console.log('intentDeliveryInfo', intentDeliveryInfo);
              //   })();
              // }

              toast(
                <NotificationSuccess
                  sonicScanLink={sonicScanLink}
                  summary={`Swapped ${inputAmountFormatted} ${formatSymbol(inputAmount.currency.spokeVersion || inputAmount.currency.symbol)} for ${outputAmountFormatted} ${formatSymbol(outputAmount.currency.spokeVersion || outputAmount.currency.symbol)}`}
                />,
                {
                  toastId: order.intentHash,
                  autoClose: 3000,
                  onClick: () => window.open(sonicScanLink, '_blank'),
                },
              );
            } else {
              console.warn('Tokens data not available for order:', order.intentHash);
            }
          } else if (newStatus === UnifiedTransactionStatus.failed) {
            // Check if srcToken is available before creating CurrencyAmount
            if (tokensData?.srcToken) {
              // Format amounts for the failure notification
              const inputAmount = CurrencyAmount.fromRawAmount(
                tokensData.srcToken,
                toBigIntSafe(order.intent.inputAmount),
              );

              const inputAmountFormatted = formatBalance(
                inputAmount.toFixed(),
                prices?.[inputAmount.currency.symbol]?.toFixed() || 1,
              );

              toast(
                <NotificationError
                  failureReason={`${inputAmountFormatted} ${formatSymbol(inputAmount.currency.spokeVersion || inputAmount.currency.symbol)} for ${tokensData?.dstToken?.symbol || 'token'} order failed. `}
                  sonicScanLink={sonicScanLink}
                />,
                {
                  toastId: order.intentHash,
                  autoClose: 3000,
                },
              );
            } else {
              console.warn('Source token data not available for order:', order.intentHash);
            }
          }
        }
      } else {
        // Handle error case
        if (order.status !== UnifiedTransactionStatus.failed) {
          updateOrderStatus(order.intentHash, UnifiedTransactionStatus.failed);

          // Check if srcToken is available before creating CurrencyAmount
          if (tokensData?.srcToken) {
            // Show failure toast
            const inputAmount = CurrencyAmount.fromRawAmount(
              tokensData.srcToken,
              toBigIntSafe(order.intent.inputAmount),
            );

            const inputAmountFormatted = formatBalance(
              inputAmount.toFixed(),
              prices?.[inputAmount.currency.symbol]?.toFixed() || 1,
            );

            toast(
              <NotificationError
                failureReason={`${inputAmountFormatted} ${formatSymbol(inputAmount.currency.spokeVersion || inputAmount.currency.symbol)} for ${tokensData?.dstToken?.symbol || 'token'} order failed. `}
                sonicScanLink={sonicScanLink}
              />,
              {
                toastId: order.intentHash,
                autoClose: 3000,
              },
            );
          } else {
            console.warn('Source token data not available for order:', order.intentHash);
          }
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
