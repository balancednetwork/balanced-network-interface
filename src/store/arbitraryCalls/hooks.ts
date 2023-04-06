import * as React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppState } from 'store';

import {
  addCall,
  addCallStruct,
  removeCall,
  removeCallStruct,
  updateCall,
  updateCallMethod,
  updateCallParam,
  updateCallStructParam,
} from './actions';
import { ArbitraryCallParameterType, EditableArbitraryCall } from './reducer';

export function useEditableContractCalls(): EditableArbitraryCall[] {
  return useSelector((state: AppState) => state.arbitraryCalls.editing);
}

export function useAddCall(): () => void {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    dispatch(addCall({ editableCall: {} }));
  }, [dispatch]);
}

export function useUpdateCallInput(): (callIndex: number, event: React.ChangeEvent<HTMLInputElement>) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        updateCall({
          callIndex,
          event,
        }),
      );
    },
    [dispatch],
  );
}

export function useUpdateCallMethod(): (callIndex: number, method: string) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, method: string) => {
      dispatch(
        updateCallMethod({
          callIndex,
          method,
        }),
      );
    },
    [dispatch],
  );
}

export function useRemoveCall(): (callIndex: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number) => {
      dispatch(
        removeCall({
          callIndex,
        }),
      );
    },
    [dispatch],
  );
}

export function useRemoveCallStruct(): (callIndex: number, paramName: string, structIndex: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, paramName: string, structIndex: number) => {
      dispatch(
        removeCallStruct({
          callIndex,
          paramName,
          structIndex,
        }),
      );
    },
    [dispatch],
  );
}

export function useUpdateCallMethodParam(): (
  callIndex: number,
  name: string,
  value: string,
  type: ArbitraryCallParameterType,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, name: string, value: string, type: ArbitraryCallParameterType) => {
      dispatch(
        updateCallParam({
          callIndex,
          name,
          value,
          type,
        }),
      );
    },
    [dispatch],
  );
}

export function useAddCallStruct(): (callIndex: number, name: string) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, name: string) => {
      dispatch(addCallStruct({ callIndex, name }));
    },
    [dispatch],
  );
}

export function useUpdateCallMethodStructParam(): (
  callIndex: number,
  paramName: string,
  structIndex: number,
  fieldName: string,
  fieldValue: string,
  fieldType: ArbitraryCallParameterType,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (
      callIndex: number,
      paramName: string,
      structIndex: number,
      fieldName: string,
      fieldValue: string,
      fieldType: ArbitraryCallParameterType,
    ) => {
      dispatch(
        updateCallStructParam({
          callIndex,
          paramName,
          structIndex,
          fieldName,
          fieldValue,
          fieldType,
        }),
      );
    },
    [dispatch],
  );
}
