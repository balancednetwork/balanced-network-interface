import * as React from 'react';

import { Flex } from 'rebass';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { CxMethodInput } from 'hooks/useCxApi';
import { useAddCallStruct, useUpdateCallMethodParam, useUpdateCallMethodStructParam } from 'store/arbitraryCalls/hooks';
import {
  ArbitraryCallParameter,
  ArbitraryCallParameterType,
  EditableArbitraryCall,
  EditableArbitraryCallParameter,
} from 'store/arbitraryCalls/reducer';

import { FieldInput } from '..';

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

  return (
    <ParamWrap>
      <Typography variant="h3" mb={isParamPrimitive ? '0' : '15px'}>
        {param.name}
      </Typography>
      {isParamPrimitive ? (
        <FieldInput
          placeholder={param.type}
          value={paramValue as string}
          onChange={handleParamChange}
          name={param.name}
        />
      ) : (
        <>
          {paramValue &&
            (paramValue as { [key in string]: ArbitraryCallParameter }[]).map((struct, structIndex) =>
              param.fields?.map(
                (field, index) =>
                  field.type !== '[]struct' && (
                    <React.Fragment key={index}>
                      <Typography variant="h4">{field.name}</Typography>
                      <FieldInput
                        placeholder={field.type}
                        value={struct[field.name] ? (struct[field.name].value as string) : ''}
                        onChange={e => handleStructParamChange(e, structIndex, field.type)}
                        name={field.name}
                      />
                    </React.Fragment>
                  ),
              ),
            )}

          <div onClick={handleAddStruct}>Add {param.name} item</div>
        </>
      )}
    </ParamWrap>
  );
};

export default ArbitraryCallMethodParameter;
