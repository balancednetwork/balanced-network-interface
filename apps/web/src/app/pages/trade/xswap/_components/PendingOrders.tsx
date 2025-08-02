import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { Button } from '@/app/components/Button';
import Divider from '@/app/components/Divider';
import { BoxPanel } from '@/app/components/Panel';
import { Typography } from '@/app/theme';
import { UnifiedTransactionStatus } from '@/hooks/useCombinedTransactions';
import { statusCodeToMessage } from '@/lib/sodax/utils';
import { useOrderStore } from '@/store/order/useOrderStore';
import { Trans } from '@lingui/macro';
import { Hex, Intent, PacketData } from '@sodax/sdk';
import { Box, Flex } from 'rebass/styled-components';

const MotionBoxPanel = motion(BoxPanel);
const MotionBox = motion(Box);

const OrderStatus = ({
  order,
  isLast,
}: {
  order: { intentHash: Hex; intent: Intent; packet: PacketData; status: UnifiedTransactionStatus };
  isLast: boolean;
}) => {
  const removeOrder = useOrderStore(state => state.removeOrder);

  const getStatusMessage = (status: UnifiedTransactionStatus) => {
    switch (status) {
      case UnifiedTransactionStatus.success:
        return 'Success';
      case UnifiedTransactionStatus.failed:
        return 'Failed';
      case UnifiedTransactionStatus.pending:
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <MotionBox
      key={order.intentHash}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
    >
      <Typography>Order ID: {order.intent.intentId.toString()}</Typography>
      <Typography>Intent Hash: {order.intentHash}</Typography>
      <Typography>Intent Tx Hash: {order.packet.dst_tx_hash as Hex}</Typography>
      <Typography>
        Status: <strong>{getStatusMessage(order.status)}</strong>
      </Typography>
      <Button onClick={() => removeOrder(order.intentHash)} mt={2}>
        Remove
      </Button>
      {!isLast && <Divider my={4} />}
    </MotionBox>
  );
};

const PendingOrders: React.FC = () => {
  const { orders } = useOrderStore();
  const showPanel = orders.length > 0;

  return (
    <AnimatePresence>
      {showPanel && (
        <MotionBoxPanel
          bg="bg2"
          mt="50px"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h2" mr={2} mb={4}>
            <Trans>Orders</Trans>
          </Typography>
          <Box mt={2}>
            <AnimatePresence>
              {orders.map((order, index) => (
                <OrderStatus key={order.intentHash} order={order} isLast={index === orders.length - 1} />
              ))}
            </AnimatePresence>
          </Box>
        </MotionBoxPanel>
      )}
    </AnimatePresence>
  );
};

export default PendingOrders;
