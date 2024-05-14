import React, { useMemo } from 'react';

import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import { useBridgeTransferStore } from '../_zustand/useBridgeTransferStore';
import { bridgeTransferHistoryActions, useBridgeTransferHistoryStore } from '../_zustand/useBridgeTransferHistoryStore';
import { getNetworkDisplayName } from '../utils';
import { BridgeTransferStatus } from '../_zustand/types';

const BridgeTransferState = () => {
  const { transferId } = useBridgeTransferStore();
  useBridgeTransferHistoryStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);

  const message = useMemo(() => {
    if (!transfer) {
      return `Transfer not found.`;
    }

    switch (transfer.status) {
      case BridgeTransferStatus.TRANSFER_REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}...`;
      case BridgeTransferStatus.TRANSFER_FAILED:
        return `Transfer failed.`;
      case BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}...`;
      case BridgeTransferStatus.CALL_MESSAGE_SENT:
        return `Finalising transaction on ${getNetworkDisplayName(transfer.destinationChainId)}...`;
      case BridgeTransferStatus.CALL_MESSAGE:
        return `Finalising transaction on ${getNetworkDisplayName(transfer.destinationChainId)}...`;
      case BridgeTransferStatus.CALL_EXECUTED:
        return `Call executed.`;
      default:
        return `Unknown state.`;
    }
  }, [transfer]);

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
              <Trans>{message}</Trans>
            </Typography>
            <Spinner />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default BridgeTransferState;
