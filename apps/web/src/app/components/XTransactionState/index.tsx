import React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import { XTransaction } from '@/lib/xcall/_zustand/types';
import { xMessageActions } from '@/lib/xcall/_zustand/useXMessageStore';

const XTransactionState = ({ xTransaction }: { xTransaction: XTransaction }) => {
  const { primaryMessageId, secondaryMessageId } = xTransaction;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Box pt={3}>
          <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
            {!secondaryMessageId && (
              <Typography mb={4}>
                <Trans>{xMessageActions.getXMessageStatusDescription(primaryMessageId)}</Trans>
              </Typography>
            )}
            {secondaryMessageId && (
              <Typography mb={4}>
                <Trans>{xMessageActions.getXMessageStatusDescription(secondaryMessageId)}</Trans>
              </Typography>
            )}
            <Spinner />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default XTransactionState;
