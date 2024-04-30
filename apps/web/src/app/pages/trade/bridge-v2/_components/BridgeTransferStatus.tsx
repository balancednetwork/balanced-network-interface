import React from 'react';

import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { XCallEventType } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import { useBridgeTransferStore } from '../_zustand/useBridgeTransferStore';

const BridgeTransferStatus = () => {
  // const message = `Awaiting confirmation on ${getNetworkDisplayName()}.`;
  // const message = `Awaiting confirmation on ICON.`;

  const { transfer } = useBridgeTransferStore();

  return (
    <AnimatePresence>
      <motion.div
        key="event-wrap-CallMessage"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Box pt={3}>
          <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
            <Typography mb={4}>
              <Trans>{transfer?.status}</Trans>
              {Object.keys(transfer.events).map(eventType => {
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
