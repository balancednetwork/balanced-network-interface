import { createAction } from '@reduxjs/toolkit';

import { CxMethodInput } from 'hooks/useCxApi';

import { ArbitraryCallParameterType } from './reducer';

export const addCall = createAction<{ editableCall: {} }>('arbitraryCalls/addCall');

export const addCallStruct = createAction<{ callIndex: number; name: string }>('arbitraryCalls/addCallStruct');

export const addCallListItem = createAction<{ callIndex: number; name: string; type: ArbitraryCallParameterType }>(
  'arbitraryCalls/addCallListItem',
);

export const removeCall = createAction<{ callIndex: number }>('arbitraryCalls/removeCall');

export const removeCallListItem = createAction<{ callIndex: number; paramName: string; itemIndex: number }>(
  'arbitraryCalls/removeCallListItem',
);

export const updateCallContract = createAction<{ callIndex: number; contract: string }>(
  'arbitraryCalls/updateCallContract',
);

export const updateCallMethod = createAction<{ callIndex: number; method: string; inputs: CxMethodInput[] }>(
  'arbitraryCalls/updateCallMethod',
);

export const updateCallParam = createAction<{
  callIndex: number;
  name: string;
  value: string;
  type: ArbitraryCallParameterType;
}>('arbitraryCalls/updateCallParam');

export const updateCallStructParam = createAction<{
  callIndex: number;
  paramName: string;
  structIndex: number;
  fieldName: string;
  fieldValue: string;
  fieldType: ArbitraryCallParameterType;
}>('arbitraryCalls/updateCallStructParam');

export const updateCallListParam = createAction<{
  callIndex: number;
  paramName: string;
  itemIndex: number;
  value: string;
  type: ArbitraryCallParameterType;
}>('arbitraryCalls/updateCallListParam');

export const resetArbitraryCalls = createAction('arbitraryCalls/resetArbitraryCalls');
