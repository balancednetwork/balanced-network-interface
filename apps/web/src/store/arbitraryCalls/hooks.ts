import * as React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { CxMethodInput } from 'hooks/useCxApi';
import { AppState } from 'store';

import {
  addCall,
  addCallStruct,
  addCallListItem,
  removeCall,
  resetArbitraryCalls,
  updateCallContract,
  updateCallMethod,
  updateCallParam,
  updateCallStructParam,
  removeCallListItem,
  updateCallListParam,
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

export function useUpdateCallContract(): (callIndex: number, contract: string) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, contract: string) => {
      dispatch(
        updateCallContract({
          callIndex,
          contract,
        }),
      );
    },
    [dispatch],
  );
}

export function useUpdateCallMethod(): (callIndex: number, method: string, inputs: CxMethodInput[]) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, method: string, inputs: CxMethodInput[]) => {
      dispatch(
        updateCallMethod({
          callIndex,
          method,
          inputs,
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

export function useRemoveCallListItem(): (callIndex: number, paramName: string, itemIndex: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, paramName: string, itemIndex: number) => {
      dispatch(
        removeCallListItem({
          callIndex,
          paramName,
          itemIndex,
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

export function useAddCallListItem(): (callIndex: number, paramName: string, type: ArbitraryCallParameterType) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, paramName: string, type: ArbitraryCallParameterType) => {
      dispatch(addCallListItem({ callIndex, name: paramName, type: type }));
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

export function useUpdateCallMethodPrimitiveListParam(): (
  callIndex: number,
  paramName: string,
  itemIndex: number,
  value: string,
  type: ArbitraryCallParameterType,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (callIndex: number, paramName: string, itemIndex: number, value: string, type: ArbitraryCallParameterType) => {
      dispatch(
        updateCallListParam({
          callIndex,
          paramName,
          itemIndex,
          value,
          type,
        }),
      );
    },
    [dispatch],
  );
}

export function useResetArbitraryCalls(): () => void {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    dispatch(resetArbitraryCalls());
  }, [dispatch]);
}
