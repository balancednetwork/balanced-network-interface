import { useStatus } from '@sodax/dapp-kit';
import { Hex } from '@sodax/sdk';
import { SolverIntentStatusCode } from '@sodax/sdk';
import React from 'react';

import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { Order, useOrderStore } from './useOrderStore';

// Individual component for each order to safely use the useStatus hook
const OrderStatusUpdater: React.FC<{ order: Order }> = ({ order }) => {
  const { updateOrderStatus } = useOrderStore();
  const { data: status } = useStatus(typeof order.packet === 'string' ? (order.packet as Hex) : ('' as Hex));

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
            // Keep as pending for other statuses (NOT_FOUND, NOT_STARTED_YET, STARTED_NOT_FINISHED)
            newStatus = null;
            break;
        }

        // Only update if status has changed and we have a new status
        if (newStatus && order.status !== newStatus) {
          updateOrderStatus(order.intentHash, newStatus);
        }
      } else {
        // Handle error case
        if (order.status !== UnifiedTransactionStatus.failed) {
          updateOrderStatus(order.intentHash, UnifiedTransactionStatus.failed);
        }
      }
    }
  }, [status, order, updateOrderStatus]);

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
