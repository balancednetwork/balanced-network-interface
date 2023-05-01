import * as React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Flex } from 'rebass';
import styled from 'styled-components';

import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as RemoveIcon } from 'assets/icons/remove.svg';
import { useCxApi } from 'hooks/useCxApi';
import { useRemoveCall, useUpdateCallContract } from 'store/arbitraryCalls/hooks';
import { EditableArbitraryCall } from 'store/arbitraryCalls/reducer';

import { FieldInput } from '..';
import ArbitraryCallMethodParameter from './ArbitraryCallMethodParameter';
import ArbitraryCallMethodSelector from './ArbitraryCallMethodSelector';
import { inputVariants } from './ArbitraryCallsForm';

const ArbitraryCallWrap = styled(Flex)`
  flex-wrap: wrap;
  margin-bottom: 25px;
`;

const ParamsWrap = styled.div`
  width: 100%;
  @media screen and (min-width: 1000px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 30px;
  }
`;

export const RemoveButton = styled.button`
  padding: 3px 0 3px 3px;
  margin: 0;
  background: none;
  appearance: none;
  border: none;
  outline: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const ArbitraryCall = ({ call, callIndex }: { callIndex: number; call: EditableArbitraryCall }) => {
  const { contract, method } = call;
  const { data: cxApi, isLoading, isError } = useCxApi(contract);
  const updateCallContract = useUpdateCallContract();
  const removeCall = useRemoveCall();

  const paramsToFill = React.useMemo(() => {
    if (!cxApi || !method) {
      return [];
    }
    const methodData = cxApi.find(m => m.name === method);
    if (!methodData) {
      return [];
    }
    return methodData.inputs;
  }, [cxApi, method]);

  const handleRemoveCall = (callIndex: number) => {
    removeCall(callIndex);
  };

  return (
    <ArbitraryCallWrap>
      <Flex justifyContent="space-between" width="100%">
        <Typography variant="h3">
          <Trans>Contract address</Trans>
        </Typography>
        <RemoveButton onClick={() => handleRemoveCall(callIndex)} title="Remove call">
          <RemoveIcon width={18} />
        </RemoveButton>
      </Flex>
      <FieldInput
        name="contract"
        value={contract || ''}
        onChange={e => updateCallContract(callIndex, e.target.value)}
      />
      <AnimatePresence>
        {isLoading && (
          <motion.div {...inputVariants} style={{ textAlign: 'center' }}>
            <Spinner size={25} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isError ||
          (!!contract && !isLoading && !cxApi && (
            <motion.div {...inputVariants}>
              <Typography color="alert">
                <Trans>Invalid contract address</Trans>
              </Typography>
            </motion.div>
          ))}
      </AnimatePresence>
      <AnimatePresence>
        {isError && !!contract && !isLoading && !cxApi && (
          <motion.div {...inputVariants}>
            <Typography color="alert">
              <Trans>Contract doesn't exist on this network.</Trans>
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isLoading && cxApi && (
          <motion.div {...inputVariants}>
            <ArbitraryCallMethodSelector cxApi={cxApi} call={call} callIndex={callIndex} />
          </motion.div>
        )}
      </AnimatePresence>

      <ParamsWrap>
        <AnimatePresence>
          {paramsToFill.map((param, index) => (
            <motion.div key={index} {...inputVariants} transition={{ delay: 0.1 * index }}>
              <ArbitraryCallMethodParameter key={index} param={param} callIndex={callIndex} call={call} />
            </motion.div>
          ))}
        </AnimatePresence>
      </ParamsWrap>
    </ArbitraryCallWrap>
  );
};

export default ArbitraryCall;
