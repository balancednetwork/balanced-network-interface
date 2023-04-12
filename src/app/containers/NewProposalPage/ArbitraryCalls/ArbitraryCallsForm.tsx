import * as React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { UnderlineText } from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { useAddCall, useEditableContractCalls } from 'store/arbitraryCalls/hooks';

import ArbitraryCall from './ArbitraryCall';
import { getTransactionsString } from './utils';

const Divider = styled(Box)`
  height: 1px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.divider};
  }
`;

export const inputVariants = {
  initial: { opacity: 0, y: -15, height: 0, width: '100%' },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -15, height: 0 },
};

const ArbitraryCallsForm = () => {
  const editableCalls = useEditableContractCalls();
  const addCall = useAddCall();

  const testExecution = () => {
    const txsString = getTransactionsString(editableCalls);
    return txsString;
    // tryExecuteWithTransactionsString(txsString);
  };

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
            <Divider pt="15px" pb="25px" />
          </motion.div>
        ))}
      </AnimatePresence>
      <UnderlineText onClick={addCall}>
        <Typography color="primaryBright">
          <Trans>Add an arbitrary call</Trans>
        </Typography>
      </UnderlineText>
      <Flex>
        <Button
          mt={5}
          onClick={() => {
            navigator.clipboard.writeText(testExecution());
          }}
        >
          Copy tx string
        </Button>
      </Flex>
    </>
  );
};

export default ArbitraryCallsForm;
