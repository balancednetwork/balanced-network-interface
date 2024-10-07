import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import { XMessage, XMessageStatus, XTransaction, XTransactionStatus } from '@/xwagmi/xcall/types';
import { xMessageActions } from '@/xwagmi/xcall/zustand/useXMessageStore';
import { getNetworkDisplayName } from '@/xwagmi/utils';

const getDescription = (xMessage: XMessage | undefined) => {
  if (!xMessage) return '';

  switch (xMessage.status) {
    case XMessageStatus.FAILED:
      return 'Transfer failed.';
    case XMessageStatus.ROLLBACKED:
      return 'Transfer rollbacked.';
    case XMessageStatus.REQUESTED:
    case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
      return `Confirming transaction on ${getNetworkDisplayName(xMessage.sourceChainId)}...`;
    case XMessageStatus.CALL_MESSAGE_SENT:
    case XMessageStatus.CALL_MESSAGE:
      return `Finalising transaction on ${getNetworkDisplayName(xMessage.destinationChainId)}...`;
    case XMessageStatus.CALL_EXECUTED:
      return 'Completed.';
    default:
      return 'Unknown';
  }
};

const XTransactionState = ({ xTransaction }: { xTransaction: XTransaction }) => {
  const primaryMessage = xMessageActions.getOf(xTransaction.id, true);
  const secondaryMessage = xMessageActions.getOf(xTransaction.id, false);

  const description = useMemo(() => {
    if (xTransaction.secondaryMessageRequired) {
      let description = '';
      if (primaryMessage) {
        switch (primaryMessage.status) {
          case XMessageStatus.FAILED:
            description = 'Transfer failed.';
            break;
          case XMessageStatus.ROLLBACKED:
            description = 'Transfer rollbacked.';
            break;
          case XMessageStatus.REQUESTED:
          case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
          case XMessageStatus.CALL_MESSAGE_SENT:
          case XMessageStatus.CALL_MESSAGE:
          case XMessageStatus.CALL_EXECUTED:
            description = `Confirming transaction on ${getNetworkDisplayName(primaryMessage.sourceChainId)}...`;
            break;
          default:
            description = 'Unknown';
            break;
        }
      }
      if (secondaryMessage) {
        switch (secondaryMessage.status) {
          case XMessageStatus.FAILED:
            description = 'Transfer failed.';
            break;
          case XMessageStatus.ROLLBACKED:
            description = 'Transfer rollbacked.';
            break;
          case XMessageStatus.REQUESTED:
          case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
          case XMessageStatus.CALL_MESSAGE_SENT:
          case XMessageStatus.CALL_MESSAGE:
            description = `Finalising transaction on ${getNetworkDisplayName(secondaryMessage.destinationChainId)}...`;
            break;
          case XMessageStatus.CALL_EXECUTED:
            description = `Completed.`;
            break;
          default:
            description = 'Unknown';
            break;
        }
      }

      return description;
    } else {
      return getDescription(primaryMessage);
    }
  }, [primaryMessage, secondaryMessage, xTransaction]);

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
              <Trans>{description}</Trans>
            </Typography>
            <Spinner success={xTransaction.status === XTransactionStatus.success} />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default XTransactionState;
