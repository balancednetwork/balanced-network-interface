import React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

import Spinner from 'app/components/Spinner';
import { XCallTransaction } from '../_zustand/types';
import { xCallMessageActions } from '../_zustand/useXCallMessageStore';

const XCallTransactionState = ({ xCallTransaction }: { xCallTransaction: XCallTransaction }) => {
  const { primaryMessageId, secondaryMessageId } = xCallTransaction;

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
                <Trans>{xCallMessageActions.getXCallMessageStatusDescription(primaryMessageId)}</Trans>
              </Typography>
            )}
            {secondaryMessageId && (
              <Typography mb={4}>
                <Trans>{xCallMessageActions.getXCallMessageStatusDescription(secondaryMessageId)}</Trans>
              </Typography>
            )}
            <Spinner />
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default XCallTransactionState;
