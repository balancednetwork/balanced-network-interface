import { useStatus } from '@sodax/dapp-kit';
import { Hex } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import React from 'react';
import { toast } from 'react-toastify';

import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { NotificationSuccess, NotificationError } from '@/app/components/Notification/TransactionNotification';
import { Order, useOrderStore } from './useOrderStore';
import { getTokenDataFromIntent } from '@/app/components/RecentActivity/transactions/IntentSwap';

// Individual component for each order to safely use the useStatus hook
const OrderStatusUpdater: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrderStatus } = useOrderStore();
  const { data: status } = useStatus(
    typeof order.packet.dstTxHash === 'string' ? (order.packet.dstTxHash as Hex) : ('' as Hex),
  );
  const sonicScanLink = `https://sonicscan.org/tx/${order.packet.dstTxHash}`;
  const tokensData = getTokenDataFromIntent(order.intent);

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
            toast(
              <NotificationSuccess
                sonicScanLink={sonicScanLink}
                summary={`${tokensData?.srcToken?.symbol} for ${tokensData?.dstToken?.symbol} order completed successfully.`}
              />,
              {
                toastId: order.intentHash,
                autoClose: 5000,
              },
            );
          } else if (newStatus === UnifiedTransactionStatus.failed) {
            toast(
              <NotificationError
                failureReason={`${tokensData?.srcToken?.symbol} for ${tokensData?.dstToken?.symbol} order failed. `}
                sonicScanLink={sonicScanLink}
              />,
              {
                toastId: order.intentHash,
                autoClose: 5000,
              },
            );
          }
        }
      } else {
        // Handle error case
        if (order.status !== UnifiedTransactionStatus.failed) {
          updateOrderStatus(order.intentHash, UnifiedTransactionStatus.failed);

          // Show failure toast
          toast(
            <NotificationError
              failureReason={`${tokensData?.srcToken?.symbol} for ${tokensData?.dstToken?.symbol} order failed. `}
              sonicScanLink={sonicScanLink}
            />,
            {
              toastId: order.intentHash,
              autoClose: 5000,
            },
          );
        }
      }
    }
  }, [status, order, updateOrderStatus, tokensData, sonicScanLink]);

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
