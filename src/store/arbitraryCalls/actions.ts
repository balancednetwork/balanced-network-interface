import { createAction } from '@reduxjs/toolkit';

import { ArbitraryCallParameterType } from './reducer';

export const addCall = createAction<{ editableCall: {} }>('arbitraryCalls/addCall');

export const addCallStruct = createAction<{ callIndex: number; name: string }>('arbitraryCalls/addCallStruct');

export const removeCall = createAction<{ callIndex: number }>('arbitraryCalls/removeCall');

export const removeCallStruct = createAction<{ callIndex: number; paramName: string; structIndex }>(
  'arbitraryCalls/removeCallStruct',
);

export const updateCallContract = createAction<{ callIndex: number; contract: string }>(
  'arbitraryCalls/updateCallContract',
);

export const updateCallMethod = createAction<{ callIndex: number; method: string }>('arbitraryCalls/updateCallMethod');

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

export const resetArbitraryCalls = createAction('arbitraryCalls/resetArbitraryCalls');
