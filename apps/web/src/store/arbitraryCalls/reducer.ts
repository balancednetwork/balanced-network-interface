import { createReducer } from '@reduxjs/toolkit';

import {
  addCall,
  addCallStruct,
  addCallListItem,
  removeCall,
  removeCallListItem,
  resetArbitraryCalls,
  updateCallMethod,
  updateCallParam,
  updateCallStructParam,
  updateCallContract,
  updateCallListParam,
} from './actions';

export type ArbitraryCallParameterType =
  | 'Address'
  | 'bytes'
  | 'str'
  | 'int'
  | 'bool'
  | 'struct'
  | '[]Address'
  | '[]str'
  | '[]int'
  | '[]bool'
  | '[]struct';

export type ArbitraryCallParameter = {
  type: ArbitraryCallParameterType;
  value: string | { [key in string]: ArbitraryCallParameter }[];
};

export type EditableArbitraryCallParameter = {
  name?: string;
  type?: ArbitraryCallParameterType;
  value: string | string[] | { [key in string]: ArbitraryCallParameter }[];
};

export type ArbitraryCall = {
  address: string;
  method: string;
  parameters?: ArbitraryCallParameter[];
};

export type EditableArbitraryCall = {
  contract?: string;
  method?: string;
  parameters?: EditableArbitraryCallParameter[];
};

export type ArbitraryCallsState = {
  calls: ArbitraryCall[];
  editing: EditableArbitraryCall[];
};

const initialState: ArbitraryCallsState = {
  calls: [],
  editing: [],
};

export default createReducer(initialState, builder =>
  builder
    .addCase(addCall, (state, { payload: { editableCall } }) => {
      state.editing.push(editableCall);
    })
    .addCase(updateCallContract, (state, { payload: { callIndex, contract } }) => {
      const editing = { ...state.editing[callIndex] };
      editing.contract = contract;
      editing.method = undefined;
      editing.parameters = undefined;

      state.editing[callIndex] = editing;
    })
    .addCase(updateCallMethod, (state, { payload: { callIndex, method, inputs } }) => {
      const editing = { ...state.editing[callIndex] };
      editing.method = method;
      editing.parameters = inputs?.map(input => ({ name: input.name, type: input.type, value: '' }));

      state.editing[callIndex] = editing;
    })
    .addCase(updateCallParam, (state, { payload: { callIndex, name, value, type } }) => {
      const editing = { ...state.editing[callIndex] };

      if (!editing.parameters) {
        editing.parameters = [{ value, type, name }];
      } else {
        const editingParam = editing.parameters.find(param => param.name === name);
        if (editingParam) {
          editingParam.value = value;
        } else {
          editing.parameters.push({ value, type, name });
        }
      }

      state.editing[callIndex] = editing;
    })
    .addCase(
      updateCallStructParam,
      (state, { payload: { callIndex, paramName, structIndex, fieldName, fieldValue, fieldType } }) => {
        const editing = { ...state.editing[callIndex] };

        if (!editing.parameters) {
          editing.parameters = [{ value: [{ [fieldName]: { value: fieldValue, type: fieldType } }], type: '[]struct' }];
        } else {
          const editingParam = editing.parameters.find(param => param.name === paramName);
          if (editingParam) {
            const editingStruct = editingParam.value[structIndex];
            if (editingStruct) {
              editingStruct[fieldName] = { value: fieldValue, type: fieldType };
            } else {
              editingParam.value = [
                ...(editingParam.value as []),
                { [fieldName]: { value: fieldValue, type: fieldType } },
              ];
            }
          }
        }

        state.editing[callIndex] = editing;
      },
    )
    .addCase(updateCallListParam, (state, { payload: { callIndex, paramName, itemIndex, value, type } }) => {
      const editing = { ...state.editing[callIndex] };

      if (!editing.parameters) {
        editing.parameters = [{ value: [value], type, name: paramName }];
      } else {
        const editingParam = editing.parameters.find(param => param.name === paramName);
        if (editingParam) {
          if (editingParam.value.length >= itemIndex + 1) {
            editingParam.value = [
              ...(editingParam.value as string[]).slice(0, itemIndex),
              value,
              ...(editingParam.value as []).slice(itemIndex + 1),
            ];
          } else {
            editingParam.value = [...(editingParam.value as []), value];
          }
        } else {
          editing.parameters = [...editing.parameters, { value: [value], type, name: paramName }];
        }
      }

      state.editing[callIndex] = editing;
    })
    .addCase(addCallStruct, (state, { payload: { callIndex, name } }) => {
      const editing = { ...state.editing[callIndex] };

      if (!editing.parameters) {
        editing.parameters = [{ value: [{}], type: '[]struct', name }];
      } else {
        const editingParam = editing.parameters.find(param => param.name === name);
        if (editingParam) {
          editingParam.value = [...(editingParam.value as []), {}];
        } else {
          editing.parameters = [...editing.parameters, { value: [{}], type: '[]struct', name }];
        }
      }

      state.editing[callIndex] = editing;
    })
    .addCase(addCallListItem, (state, { payload: { callIndex, name, type } }) => {
      const editing = { ...state.editing[callIndex] };

      if (!editing.parameters) {
        editing.parameters = [{ value: [''], type, name }];
      } else {
        const editingParam = editing.parameters.find(param => param.name === name);
        if (editingParam) {
          editingParam.value = [...(editingParam.value as []), ''];
        } else {
          editing.parameters = [...editing.parameters, { value: [''], type, name }];
        }
      }

      state.editing[callIndex] = editing;
    })
    .addCase(removeCallListItem, (state, { payload: { callIndex, paramName, itemIndex } }) => {
      const editing = { ...state.editing[callIndex] };

      const editingParam = editing.parameters?.find(param => param.name === paramName);
      if (editingParam) {
        (editingParam.value as { [key in string]: ArbitraryCallParameter }[] | string[]).splice(itemIndex, 1);
      }

      state.editing[callIndex] = editing;
    })
    .addCase(removeCall, (state, { payload: { callIndex } }) => {
      state.editing.splice(callIndex, 1);
    })
    .addCase(resetArbitraryCalls, state => {
      state.editing = [];
    }),
);
