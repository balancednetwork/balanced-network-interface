import React from 'react';

import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import { useBridgeTransferStore } from '../_zustand/useBridgeTransferStore';
import { bridgeTransferHistoryActions, useBridgeTransferHistoryStore } from '../_zustand/useBridgeTransferHistoryStore';

const BridgeTransferStatus = () => {
  // const message = `Awaiting confirmation on ${getNetworkDisplayName()}.`;
  // const message = `Awaiting confirmation on ICON.`;

  const { transferId } = useBridgeTransferStore();
  useBridgeTransferHistoryStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Box pt={3}>
          <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
            <Typography mb={4}>
              <Trans>{transfer?.status}</Trans>
              {Object.keys(transfer?.events || {}).map(eventType => {
                return <div>{eventType}</div>;
              })}
            </Typography>
            <Spinner />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default BridgeTransferStatus;
