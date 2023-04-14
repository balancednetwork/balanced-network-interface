import * as React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from 'app/components/DropdownText';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import { ReactComponent as CopyIcon } from 'assets/icons/copy.svg';
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

const ArbitraryCallsForm = ({ openVerificationModal }: { openVerificationModal: (bool) => void }) => {
  const editableCalls = useEditableContractCalls();
  const addCall = useAddCall();

  const [isCopied, updateCopyState] = React.useState(false);
  const copyString = React.useCallback(async () => {
    const txsString = getTransactionsString(editableCalls);
    await navigator.clipboard.writeText(txsString);
    updateCopyState(true);
    setTimeout(() => updateCopyState(false), 2000);
  }, [editableCalls]);

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
              <Trans>Contract calls</Trans>
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
          <Trans>Add a contract call</Trans>
        </Typography>
      </UnderlineText>
      <AnimatePresence>
        {editableCalls.length > 0 && (
          <motion.div {...inputVariants}>
            <Flex flexDirection="column" pt={2}>
              <Flex pt={2} mr={3}>
                <Typography color="primaryBright" fontSize={14} onClick={copyString} style={{ cursor: 'pointer' }}>
                  <UnderlineText>{isCopied ? 'String copied' : 'Copy execution string'}</UnderlineText>
                  <CopyIcon width="14" height="14" style={{ marginLeft: 7, marginRight: 0, marginTop: -1 }} />
                </Typography>
              </Flex>
              <Flex pt={2}>
                <Typography color="primaryBright" fontSize={14}>
                  <UnderlineText onClick={() => openVerificationModal(true)}>
                    <Trans>Verify execution string</Trans>
                  </UnderlineText>
                </Typography>
                <Box ml={1} pt="1px">
                  <QuestionHelper
                    text={
                      <>
                        <strong>Hana</strong> users will see an error message before signing. If it says{' '}
                        <em>Reverted(20)</em> in the end, contract calls are successfully verified.
                        <Divider my={2} />
                        <strong>Ledger</strong> users will sign a transaction and will see a result in standard
                        transaction notification.
                      </>
                    }
                  />
                </Box>
              </Flex>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ArbitraryCallsForm;
