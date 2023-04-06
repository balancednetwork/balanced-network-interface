import * as React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { ReactComponent as RemoveIcon } from 'assets/icons/remove.svg';
import { CxMethodInput } from 'hooks/useCxApi';
import {
  useAddCallStruct,
  useRemoveCallStruct,
  useUpdateCallMethodParam,
  useUpdateCallMethodStructParam,
} from 'store/arbitraryCalls/hooks';
import {
  ArbitraryCallParameter,
  ArbitraryCallParameterType,
  EditableArbitraryCall,
  EditableArbitraryCallParameter,
} from 'store/arbitraryCalls/reducer';

import { FieldInput } from '..';
import { RemoveButton } from './ArbitraryCall';
import { inputVariants } from './ArbitraryCallsForm';

const ParamWrap = styled(Flex)`
  flex-direction: column;
  width: 100%;
`;

const ArbitraryCallMethodParameter = ({
  param,
  call,
  callIndex,
}: {
  param: CxMethodInput;
  call: EditableArbitraryCall;
  callIndex: number;
  paramValues?: EditableArbitraryCallParameter[];
}) => {
  const updateCallMethodParam = useUpdateCallMethodParam();
  const addCallStruct = useAddCallStruct();
  const updateCallMethodStructParam = useUpdateCallMethodStructParam();
  const removeCallStruct = useRemoveCallStruct();

  const editableParam = call.parameters?.find(item => item.name === param.name);
  const paramValue = editableParam ? editableParam.value : '';
  const isParamPrimitive = !param.fields;

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCallMethodParam(callIndex, e.target.name, e.target.value, param.type);
  };

  const handleAddStruct = () => {
    addCallStruct(callIndex, param.name);
  };

  const handleStructParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    structIndex: number,
    fieldType: ArbitraryCallParameterType,
  ) => {
    updateCallMethodStructParam(callIndex, param.name, structIndex, e.target.name, e.target.value, fieldType);
  };

  const handleRemoveStruct = (structIndex: number) => {
    removeCallStruct(callIndex, param.name, structIndex);
  };

  return (
    <ParamWrap>
      <Typography variant="h3">{param.name}</Typography>
      {isParamPrimitive ? (
        <FieldInput
          placeholder={param.type}
          value={paramValue as string}
          onChange={handleParamChange}
          name={param.name}
        />
      ) : (
        <AnimatePresence>
          {paramValue &&
            (paramValue as { [key in string]: ArbitraryCallParameter }[]).map((struct, structIndex) =>
              param.fields?.map(
                (field, index) =>
                  field.type !== '[]struct' && (
                    <motion.div key={`${structIndex}-${index}`} {...inputVariants}>
                      <Flex width="100%" justifyContent="space-between" marginTop={index === 0 ? '25px' : '0'}>
                        <Typography variant="h4">{field.name}</Typography>
                        {index === 0 && (
                          <RemoveButton onClick={() => handleRemoveStruct(structIndex)} title="Remove struct">
                            <RemoveIcon width={18} />
                          </RemoveButton>
                        )}
                      </Flex>
                      <FieldInput
                        placeholder={field.type}
                        value={struct[field.name] ? (struct[field.name].value as string) : ''}
                        onChange={e => handleStructParamChange(e, structIndex, field.type)}
                        name={field.name}
                      />
                    </motion.div>
                  ),
              ),
            )}
          <div>
            <UnderlineText onClick={handleAddStruct}>
              <Typography color="primaryBright">
                <Trans>
                  Add <strong>{param.name}</strong> item
                </Trans>
              </Typography>
            </UnderlineText>
          </div>
        </AnimatePresence>
      )}
    </ParamWrap>
  );
};

export default ArbitraryCallMethodParameter;
