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
  useAddCallListItem,
  useRemoveCallListItem,
  useUpdateCallMethodParam,
  useUpdateCallMethodStructParam,
  useUpdateCallMethodPrimitiveListParam,
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
  const addCallListItem = useAddCallListItem();
  const addCallStruct = useAddCallStruct();
  const updateCallMethodStructListParam = useUpdateCallMethodStructParam();
  const updateCallMethodPrimitiveListParam = useUpdateCallMethodPrimitiveListParam();
  const removeCallListItem = useRemoveCallListItem();

  const editableParam = call.parameters?.find(item => item.name === param.name);
  const paramValue = editableParam ? editableParam.value : '';
  const isParamList = param.type.indexOf('[]') >= 0;
  const isParamPrimitive = !param.fields;

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCallMethodParam(callIndex, e.target.name, e.target.value, param.type);
  };

  const handleAddStruct = React.useCallback(() => {
    addCallStruct(callIndex, param.name);
  }, [addCallStruct, callIndex, param.name]);

  const handleAddItem = React.useCallback(() => {
    addCallListItem(callIndex, param.name, param.type);
  }, [addCallListItem, callIndex, param.name, param.type]);

  const handleAddToList = React.useCallback(() => {
    if (isParamPrimitive) {
      handleAddItem();
    } else {
      handleAddStruct();
    }
  }, [handleAddItem, handleAddStruct, isParamPrimitive]);

  const handleListItemParamChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    itemIndex: number,
    fieldType: ArbitraryCallParameterType,
  ) => {
    if (isParamPrimitive) {
      updateCallMethodPrimitiveListParam(callIndex, param.name, itemIndex, e.target.value, fieldType);
    } else {
      updateCallMethodStructListParam(callIndex, param.name, itemIndex, e.target.name, e.target.value, fieldType);
    }
  };

  const handleRemoveCallListItem = (itemIndex: number) => {
    removeCallListItem(callIndex, param.name, itemIndex);
  };

  React.useEffect(() => {
    if (isParamList && !paramValue) {
      handleAddToList();
    }
  }, [handleAddToList, isParamList, paramValue]);

  return (
    <ParamWrap>
      <Typography variant="h3">{param.name}</Typography>
      {!isParamList && isParamPrimitive ? (
        <FieldInput
          placeholder={param.type}
          value={paramValue as string}
          onChange={handleParamChange}
          name={param.name}
        />
      ) : (
        <>
          <AnimatePresence>
            {paramValue &&
              (isParamPrimitive
                ? (paramValue as string[]).map((item, index) => (
                    <motion.div key={index} {...inputVariants}>
                      <Flex>
                        <FieldInput
                          placeholder={param.type.replace('[]', '')}
                          value={item}
                          onChange={e => handleListItemParamChange(e, index, param.type)}
                        />
                        <RemoveButton onClick={() => handleRemoveCallListItem(index)} title="Remove item">
                          <RemoveIcon width={18} style={{ margin: '-15px 0 0 5px' }} />
                        </RemoveButton>
                      </Flex>
                    </motion.div>
                  ))
                : (paramValue as { [key in string]: ArbitraryCallParameter }[]).map((struct, structIndex) =>
                    param.fields?.map(
                      (field, index) =>
                        field.type !== '[]struct' && (
                          <motion.div key={`${structIndex}-${index}`} {...inputVariants}>
                            <Flex width="100%" justifyContent="space-between" marginTop={index === 0 ? '25px' : '0'}>
                              <Typography variant="h4">{field.name}</Typography>
                              {index === 0 && (
                                <RemoveButton
                                  onClick={() => handleRemoveCallListItem(structIndex)}
                                  title="Remove struct"
                                >
                                  <RemoveIcon width={18} />
                                </RemoveButton>
                              )}
                            </Flex>
                            <FieldInput
                              placeholder={field.type}
                              value={struct[field.name] ? (struct[field.name].value as string) : ''}
                              onChange={e => handleListItemParamChange(e, structIndex, field.type)}
                              name={field.name}
                            />
                          </motion.div>
                        ),
                    ),
                  ))}
          </AnimatePresence>
          <AnimatePresence>
            {isParamList && (
              <motion.div {...inputVariants} transition={{ delay: 0.2 }}>
                <UnderlineText onClick={handleAddToList}>
                  <Typography color="primaryBright">
                    <Trans>
                      Add <strong>{param.name}</strong> item
                    </Trans>
                  </Typography>
                </UnderlineText>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </ParamWrap>
  );
};

export default ArbitraryCallMethodParameter;
