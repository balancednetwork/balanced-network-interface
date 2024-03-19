import React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { SupportedXCallChains } from 'app/_xcall/types';
import { AppState } from 'store';

import { setDestination, setOrigin } from './actions';

export function useBridgeDirection(): AppState['bridge']['direction'] {
  return useSelector((state: AppState) => state.bridge.direction);
}

export function useSetBridgeOrigin(): (chain: SupportedXCallChains) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain: SupportedXCallChains) => {
      dispatch(setOrigin({ chain }));
    },
    [dispatch],
  );
}
export function useSetBridgeDestination(): (chain: SupportedXCallChains) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain: SupportedXCallChains) => {
      dispatch(setDestination({ chain }));
    },
    [dispatch],
  );
}
