import React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import {
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
} from '../../bridge/_zustand/useBridgeTransferHistoryStore';
import { useXCallSwapStore } from '../_zustand/useXCallSwapStore';

const XCallSwapState = () => {
  useBridgeTransferHistoryStore();
  const { transferId, childTransferId } = useXCallSwapStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);
  const childTransfer = bridgeTransferHistoryActions.get(childTransferId);

  if (!transfer) {
    return null;
  }

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
              <Trans>{bridgeTransferHistoryActions.getTransferStatusMessage(transfer)}</Trans>
            </Typography>
            {childTransfer && (
              <Typography mb={4}>
                <Trans>{bridgeTransferHistoryActions.getTransferStatusMessage(childTransfer)}</Trans>
              </Typography>
            )}
            <Spinner />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default XCallSwapState;
