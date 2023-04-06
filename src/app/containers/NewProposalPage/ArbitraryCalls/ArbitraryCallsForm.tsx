import * as React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';

import Divider from 'app/components/Divider';
import { UnderlineText } from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { useAddCall, useEditableContractCalls } from 'store/arbitraryCalls/hooks';

import ArbitraryCall from './ArbitraryCall';

export const inputVariants = {
  initial: { opacity: 0, y: -15, height: 0, width: '100%' },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -15, height: 0 },
};

const ArbitraryCallsForm = () => {
  const editableCalls = useEditableContractCalls();
  const addCall = useAddCall();

  return (
    <>
      <AnimatePresence>
        {editableCalls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Typography variant="h2" py="30px">
              Arbitrary calls
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editableCalls.map((call, index) => (
          <motion.div key={index} {...inputVariants}>
            <ArbitraryCall call={call} callIndex={index} key={index} />
            {index !== editableCalls.length - 1 && <Divider mt="15px" mb="25px" />}
          </motion.div>
        ))}
      </AnimatePresence>
      <UnderlineText onClick={addCall}>
        <Typography color="primaryBright">
          {' '}
          <Trans>Add an arbitrary call</Trans>
        </Typography>
      </UnderlineText>
    </>
  );
};

export default ArbitraryCallsForm;
