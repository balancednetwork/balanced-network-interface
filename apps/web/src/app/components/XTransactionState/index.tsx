import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import { getNetworkDisplayName, isIconTransaction } from '@balancednetwork/xwagmi';
import { XMessage, XMessageStatus, XTransaction, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xMessageActions } from '@balancednetwork/xwagmi';

const getDescription = (xMessage: XMessage | undefined, xTransactionType: XTransactionType) => {
  if (!xMessage) return '';

  if (xTransactionType === XTransactionType.SWAP || xTransactionType === XTransactionType.BRIDGE) {
    switch (xMessage.status) {
      case XMessageStatus.FAILED:
        return 'Failed.';
      case XMessageStatus.ROLLBACKED:
        return 'Transaction reverted.';
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
  } else {
    switch (xMessage.status) {
      case XMessageStatus.FAILED:
        return 'Failed.';
      case XMessageStatus.ROLLBACKED:
        return 'Transaction reverted.';
      case XMessageStatus.REQUESTED:
      case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
      case XMessageStatus.CALL_MESSAGE_SENT:
      case XMessageStatus.CALL_MESSAGE:
        return `Confirming transaction on ${getNetworkDisplayName(xMessage.sourceChainId)}...`;
      case XMessageStatus.CALL_EXECUTED:
        return 'Completed.';
      default:
        return 'Unknown';
    }
  }
};

const getXTransactionStatus = (xTransaction: XTransaction, primaryMessage, secondaryMessage) => {
  if (isIconTransaction(xTransaction?.sourceChainId, xTransaction?.finalDestinationChainId)) {
    if (xTransaction.status === XTransactionStatus.success) {
      return 'Completed.';
    }

    if (xTransaction.status === XTransactionStatus.failure) {
      return 'Failed.';
    }

    if (xTransaction.status === XTransactionStatus.pending) {
      return 'Finalising transaction on ICON...';
    }
  }

  if (xTransaction.secondaryMessageRequired) {
    let description = '';
    if (primaryMessage) {
      switch (primaryMessage.status) {
        case XMessageStatus.FAILED:
          description = 'Transfer failed.';
          break;
        case XMessageStatus.ROLLBACKED:
          description = 'Transaction reverted.';
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
          description = 'Transaction reverted.';
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
    return getDescription(primaryMessage, xTransaction.type);
  }
};

const XTransactionState = ({ xTransaction }: { xTransaction: XTransaction }) => {
  const primaryMessage = xMessageActions.getOf(xTransaction.id, true);
  const secondaryMessage = xMessageActions.getOf(xTransaction.id, false);

  const description = useMemo(() => {
    return getXTransactionStatus(xTransaction, primaryMessage, secondaryMessage);
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
            <Typography mb={1}>
              <Trans>{description}</Trans>
            </Typography>
            <motion.div
              animate={{
                opacity: xTransaction.status === XTransactionStatus.success ? 0 : 1,
                height: xTransaction.status === XTransactionStatus.success ? 0 : 'auto',
              }}
              transition={{ duration: 0.3 }}
            >
              <Typography>
                <Trans>This will take about a minute.</Trans>
              </Typography>
            </motion.div>
            <Spinner style={{ marginTop: '15px' }} success={xTransaction.status === XTransactionStatus.success} />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default XTransactionState;
