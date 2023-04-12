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

const ArbitraryCallsForm = ({
  proposalData,
  tryExecute,
}: {
  tryExecute: () => void;
  proposalData: {
    title: string;
    description: string;
    duration: string;
    forumLink: string;
    platformDay: number | undefined;
  };
}) => {
  const editableCalls = useEditableContractCalls();
  const addCall = useAddCall();
  // const { account } = useIconReact();
  // const [executionResult, setExecutionResult] = React.useState<string | undefined>();

  // const testExecution = async () => {
  //   const txsString = getTransactionsString(editableCalls);
  //   const result = await tryExecuteWithTransactionsString(account, txsString, proposalData);
  //   setExecutionResult(JSON.stringify(result));
  // };

  const copyString = () => {
    const txsString = getTransactionsString(editableCalls);
    return txsString;
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
          mr={5}
          onClick={() => {
            navigator.clipboard.writeText(copyString());
          }}
        >
          Copy tx string
        </Button>
        {/* <Button mt={5} onClick={testExecution}> */}
        <Button mt={5} onClick={tryExecute}>
          Test arb calls execution
        </Button>
      </Flex>
      {/* {executionResult && (
        <Box mt={5}>
          <Typography variant="h2">Execution result</Typography>
          <Typography>{executionResult}</Typography>
        </Box>
      )} */}
    </>
  );
};

export default ArbitraryCallsForm;
