import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useOrderStore } from '@/store/order/useOrderStore';
import { Box, Flex } from 'rebass/styled-components';
import { Hex, Intent, PacketData } from '@sodax/sdk';
import { useStatus } from '@sodax/dapp-kit';
import { statusCodeToMessage } from '@/lib/sodax/utils';
import { Typography } from '@/app/theme';
import { BoxPanel } from '@/app/components/Panel';
import { Button } from '@/app/components/Button';
import { Trans } from '@lingui/macro';
import Divider from '@/app/components/Divider';

const MotionBoxPanel = motion(BoxPanel);
const MotionBox = motion(Box);

const OrderStatus = ({
  order,
  isLast,
}: {
  order: { intentHash: Hex; intent: Intent; packet: PacketData };
  isLast: boolean;
}) => {
  const { data: status } = useStatus(order.packet.dst_tx_hash as Hex);
  const removeOrder = useOrderStore(state => state.removeOrder);

  if (status) {
    if (status.ok) {
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
            Status: <strong>{statusCodeToMessage(status.value.status)}</strong>
          </Typography>
          <Button onClick={() => removeOrder(order.intentHash)} mt={2}>
            Remove
          </Button>
          {!isLast && <Divider my={4} />}
        </MotionBox>
      );
    }

    return (
      <MotionBox
        className="flex"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      >
        <span>Error: {status.error.detail.message}</span>
        <Button onClick={() => removeOrder(order.intentHash)} mt={2}>
          Remove
        </Button>
      </MotionBox>
    );
  }

  return null;
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
