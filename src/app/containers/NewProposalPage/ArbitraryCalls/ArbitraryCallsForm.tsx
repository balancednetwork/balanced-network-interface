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
            <Flex flexDirection="row" pt={2} flexWrap="wrap">
              <Flex pt={2}>
                <Typography color="primaryBright" fontSize={14} onClick={copyString} style={{ cursor: 'pointer' }}>
                  <UnderlineText>{isCopied ? 'Data copied' : 'Copy data'}</UnderlineText>
                  <CopyIcon width="14" height="14" style={{ marginLeft: 7, marginRight: 0, marginTop: -1 }} />
                </Typography>
              </Flex>
              <Typography pt="8px" pl="7px" pr="5px">
                |
              </Typography>
              <Flex pt={2}>
                <Typography color="primaryBright" fontSize={14}>
                  <UnderlineText onClick={() => openVerificationModal(true)}>
                    {editableCalls.length > 1 ? (
                      <Trans>Verify contract calls</Trans>
                    ) : (
                      <Trans>Verify contract call</Trans>
                    )}
                  </UnderlineText>
                </Typography>
                <Box ml={1} pt="0">
                  <QuestionHelper
                    width={330}
                    text={
                      <>
                        <Typography mb={3}>
                          <Trans>Test your contract calls before you submit the proposal.</Trans>
                        </Typography>
                        <Typography fontWeight="700">
                          <Trans>On Hana:</Trans>
                        </Typography>
                        <Typography mb={3}>
                          <Trans>
                            You'll see an error message before you sign the transaction. If it ends with Reverted(20),
                            the contract calls have been verified.
                          </Trans>
                        </Typography>
                        <Typography fontWeight="700">
                          <Trans>On Ledger:</Trans>
                        </Typography>
                        <Typography>
                          <Trans>
                            Sign the transaction, then check the banner notification message for the result.
                          </Trans>
                        </Typography>
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
