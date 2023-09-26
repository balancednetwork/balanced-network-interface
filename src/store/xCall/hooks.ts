import React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import {
  OriginXCallData,
  DestinationXCallData,
  SupportedXCallChains,
  XCallChainState,
  XCallEventType,
} from 'app/_xcall/types';
import { AppState } from 'store';

import {
  addXCallDestinationEvent,
  addXCallOriginEvent,
  removeXCallDestinationEvent,
  removeXCallEvent,
  removeXCallOriginEvent,
  setListeningTo,
  stopListening,
} from './actions';

export function useXCallState(): AppState['xCall'] {
  return useSelector((state: AppState) => state.xCall);
}

export function useCurrentXCallState(): AppState['xCall']['xCall'] {
  return useSelector((state: AppState) => state.xCall.xCall);
}

export function useXCallListeningTo(): AppState['xCall']['listeningTo'] {
  return useSelector((state: AppState) => state.xCall.listeningTo);
}

export function useXCallChainState(chain: SupportedXCallChains): XCallChainState {
  return useSelector((state: AppState) => state.xCall.events[chain]);
}

export function useAddOriginEvent(): (chain: SupportedXCallChains, data: OriginXCallData) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, data) => {
      dispatch(addXCallOriginEvent({ chain, data }));
    },
    [dispatch],
  );
}

export function useAddDestinationEvent(): (chain: SupportedXCallChains, data: DestinationXCallData) => void {
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

export function useRemoveEvent(): (sn: number, setToIdle?: boolean) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (sn, setToIdle) => {
      dispatch(removeXCallEvent({ sn, setToIdle }));
    },
    [dispatch],
  );
}

export function useXCallOriginEvents(chain: SupportedXCallChains): OriginXCallData[] {
  const state = useXCallChainState(chain);
  return [...state.origin];
}

export function useXCallDestinationEvents(chain: SupportedXCallChains): DestinationXCallData[] {
  const state = useXCallChainState(chain);
  return [...state.destination];
}

export function useSetListeningTo(): (chain: SupportedXCallChains, event: XCallEventType) => void {
  const dispatch = useDispatch();
  return React.useCallback((chain, event) => dispatch(setListeningTo({ chain, event })), [dispatch]);
}

export function useStopListening(): () => void {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    dispatch(stopListening());
  }, [dispatch]);
}
