import React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { OriginCallData, DestinationCallData, SupportedXCallChains, XCallChainState } from 'app/_xcall/types';
import { AppState } from 'store';

import {
  addXCallDestinationEvent,
  addXCallOriginEvent,
  removeXCallDestinationEvent,
  removeXCallOriginEvent,
} from './actions';

export function useXCallState(): AppState['xCall'] {
  return useSelector((state: AppState) => state.xCall);
}

export function useXCallChainState(chain: SupportedXCallChains): XCallChainState {
  return useSelector((state: AppState) => state.xCall[chain]);
}

export function useAddOriginEvent(): (chain: SupportedXCallChains, data: OriginCallData) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, data) => {
      dispatch(addXCallOriginEvent({ chain, data }));
    },
    [dispatch],
  );
}

export function useAddDestinationEvent(): (chain: SupportedXCallChains, data: DestinationCallData) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, data) => {
      dispatch(addXCallDestinationEvent({ chain, data }));
    },
    [dispatch],
  );
}

export function useRemoveOriginEvent(): (chain: SupportedXCallChains, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(removeXCallOriginEvent({ chain, sn }));
    },
    [dispatch],
  );
}

export function useRemoveDestinationEvent(): (chain: SupportedXCallChains, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(removeXCallDestinationEvent({ chain, sn }));
    },
    [dispatch],
  );
}

export function useXCallOriginEvents(chain: SupportedXCallChains): OriginCallData[] {
  const state = useXCallChainState(chain);
  return [...state.origin];
}

export function useXCallDestinationEvents(chain: SupportedXCallChains): DestinationCallData[] {
  const state = useXCallChainState(chain);
  return [...state.destination];
}
