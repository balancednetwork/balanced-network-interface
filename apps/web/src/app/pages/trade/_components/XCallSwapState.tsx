import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import {
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
} from '../bridge-v2/_zustand/useBridgeTransferHistoryStore';
import { BridgeTransfer, BridgeTransferStatus } from '../bridge-v2/_zustand/types';
import { useXCallSwapStore } from '../_zustand/useXCallSwapStore';
import { getNetworkDisplayName } from '../bridge-v2/utils';

const XCallSwapState = () => {
  const { transferId, childTransferId } = useXCallSwapStore();
  useBridgeTransferHistoryStore();
  const transfer = bridgeTransferHistoryActions.get(transferId);
  const childTransfer = bridgeTransferHistoryActions.get(childTransferId);

  const getMessage = (transfer: BridgeTransfer) => {
    switch (transfer.status) {
      case BridgeTransferStatus.TRANSFER_REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}`;
      case BridgeTransferStatus.TRANSFER_FAILED:
        return `Transfer failed.`;
      case BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(transfer.sourceChainId)}`;
      case BridgeTransferStatus.CALL_MESSAGE_SENT:
        return `Awaiting execution on ${getNetworkDisplayName(transfer.destinationChainId)}`;
      case BridgeTransferStatus.CALL_MESSAGE:
        return `Awaiting execution on ${getNetworkDisplayName(transfer.destinationChainId)}`;
      case BridgeTransferStatus.CALL_EXECUTED:
        return `Call executed.`;
      default:
        return `Unknown state.`;
    }
  };

  const message = useMemo(() => {
    if (!transfer) {
      return `Transfer not found.`;
    }

    return getMessage(transfer);
  }, [transfer, getMessage]);

  const childMessage = useMemo(() => {
    if (!childTransfer) {
      return `Child transfer not found.`;
    }

    return getMessage(childTransfer);
  }, [childTransfer, getMessage]);

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
            {childTransfer && (
              <Typography mb={4}>
                <Trans>{childMessage}</Trans>
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
