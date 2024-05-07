import React from 'react';

import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import axios from 'axios';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { useIconReact } from 'packages/icon-react';

import { SUPPORTED_XCALL_CHAINS } from 'app/pages/trade/bridge-v2/_config/xTokens';
import {
  OriginXCallData,
  DestinationXCallData,
  XChainId,
  XCallChainState,
  XCallEventType,
  XCallActivityItem,
  CurrentXCallStateType,
} from 'app/pages/trade/bridge-v2/types';
import { NETWORK_ID } from 'constants/config';
import { AppState } from 'store';
import { ONE_DAY_DURATION } from 'utils';

import {
  addXCallDestinationEvent,
  addXCallOriginEvent,
  flagRollBackReady,
  removeXCallEvent,
  rollBackFromOrigin,
  setListeningTo,
  setNotPristine,
  setXCallState,
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

export function useXCallChainState(chain: XChainId): XCallChainState {
  return useSelector((state: AppState) => state.xCall.events[chain]);
}

export function useSetXCallState(): (state: CurrentXCallStateType) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    state => {
      dispatch(setXCallState({ state }));
    },
    [dispatch],
  );
}

export function useAddOriginEvent(): (chain: XChainId, data: OriginXCallData) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, data) => {
      dispatch(addXCallOriginEvent({ chain, data }));
    },
    [dispatch],
  );
}

export function useAddDestinationEvent(): (chain: XChainId, data: DestinationXCallData) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, data) => {
      dispatch(addXCallDestinationEvent({ chain, data }));
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

export function useXCallOriginEvents(chain: XChainId): OriginXCallData[] {
  const state = useXCallChainState(chain);
  return state.origin;
}

export function useXCallDestinationEvents(chain: XChainId): DestinationXCallData[] {
  const state = useXCallChainState(chain);
  return state.destination;
}

export function useSetListeningTo(): (chain: XChainId, event: XCallEventType) => void {
  const dispatch = useDispatch();
  return React.useCallback((chain, event) => dispatch(setListeningTo({ chain, event })), [dispatch]);
}

export function useStopListening(): () => void {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    dispatch(stopListening());
  }, [dispatch]);
}

export function useSetNotPristine(): () => void {
  const dispatch = useDispatch();
  return React.useCallback(() => {
    dispatch(setNotPristine());
  }, [dispatch]);
}

export function useIsAnyEventPristine(): boolean {
  const xCallState = useXCallState();
  let existPristine = false;

  SUPPORTED_XCALL_CHAINS.forEach(chain => {
    const origin = xCallState.events[chain].origin;
    const destination = xCallState.events[chain].destination;
    if (origin.some(event => event.isPristine) || destination.some(event => event.isPristine)) {
      existPristine = true;
    }
  });

  return existPristine;
}

export function useXCallActivityItems(): UseQueryResult<XCallActivityItem[] | undefined> {
  const xCallState = useXCallState();

  return useQuery({
    queryKey: ['xCallActivityItems', xCallState],
    queryFn: async () => {
      const executable = SUPPORTED_XCALL_CHAINS.map(chain => {
        const chainXCalls: XCallActivityItem[] = [];
        xCallState.events[chain].destination.forEach(event => {
          const otherChains = SUPPORTED_XCALL_CHAINS.filter(c => c !== chain);
          const originEvent = otherChains.map(chain => {
            return xCallState.events[chain].origin.find(origin => origin.sn === event.sn);
          })[0];

          if (originEvent && !originEvent.rollbackRequired) {
            chainXCalls.push({
              chain,
              destinationData: event,
              originData: originEvent,
              status: 'executable',
            });
          }
        });
        return chainXCalls.filter(xCall => xCall !== undefined);
      });

      const pending = SUPPORTED_XCALL_CHAINS.map(chain => {
        const chainXCalls: XCallActivityItem[] = [];
        xCallState.events[chain].origin.forEach(event => {
          const otherChains = SUPPORTED_XCALL_CHAINS.filter(c => c !== chain);
          const destinationEvent = otherChains.map(chain => {
            return xCallState.events[chain].destination.find(destination => destination.sn === event.sn);
          })[0];

          if (!destinationEvent) {
            chainXCalls.push({
              chain,
              originData: event,
              status: 'pending',
            });
          }
        });
        return chainXCalls.filter(xCall => xCall !== undefined);
      });

      const rollback = SUPPORTED_XCALL_CHAINS.map(chain => {
        const chainXCalls: XCallActivityItem[] = [];
        xCallState.events[chain].origin.forEach(event => {
          if (event.rollbackRequired && !event.rollbackReady) {
            const otherChains = SUPPORTED_XCALL_CHAINS.filter(c => c !== chain);
            const destinationEvent = otherChains.map(chain => {
              return xCallState.events[chain].destination.find(destination => destination.sn === event.sn);
            })[0];

            if (destinationEvent) {
              chainXCalls.push({
                chain,
                destinationData: destinationEvent,
                originData: event,
                status: 'failed',
              });
            }
          }
        });
        return chainXCalls.filter(xCall => xCall !== undefined);
      });

      const rollbackReady = SUPPORTED_XCALL_CHAINS.map(chain => {
        const chainXCalls: XCallActivityItem[] = [];
        xCallState.events[chain].origin.forEach(event => {
          if (event.rollbackReady) {
            const otherChains = SUPPORTED_XCALL_CHAINS.filter(c => c !== chain);
            const destinationEvent = otherChains.map(chain => {
              return xCallState.events[chain].destination.find(destination => destination.sn === event.sn);
            })[0];

            if (destinationEvent) {
              chainXCalls.push({
                chain,
                destinationData: destinationEvent,
                originData: event,
                status: 'rollbackReady',
              });
            }
          }
        });
        return chainXCalls.filter(xCall => xCall !== undefined);
      });

      return [...executable, ...pending, ...rollback, ...rollbackReady].flat().sort((a, b) => {
        return b.originData.timestamp - a.originData.timestamp;
      });
    },
    enabled: !!xCallState,
    placeholderData: keepPreviousData,
  });
}

export function useRollBackFromOrigin(): (chain: XChainId, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(rollBackFromOrigin({ chain, sn }));
    },
    [dispatch],
  );
}

export function useFlagRollBackReady(): (chain: XChainId, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(flagRollBackReady({ chain, sn }));
    },
    [dispatch],
  );
}

export type xCallActivityDataType = {
  hour: string;
  count: number;
};

export function useXCallStats(): UseQueryResult<{ transactionCount: number; data: xCallActivityDataType[] }> {
  const yesterdayTimestamp = new Date().getTime() - ONE_DAY_DURATION;
  async function getTxs(skip: number, limit: number) {
    const apiUrl = `https://xcallscan.xyz/api/messages?skip=${skip}&limit=${limit}`;
    const response = await axios.get(apiUrl);
    return response.data.data;
  }

  function countTransactionsByHour(transactions: { created_at: number }[]): xCallActivityDataType[] {
    const transactionCountByHour: { count: number; hour: string }[] = [];

    const yesterdayDate = new Date(yesterdayTimestamp);
    const currentHour = yesterdayDate.getHours();

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i + 1) % 24;
      transactionCountByHour.push({
        count: 1,
        hour: hour.toString().padStart(2, '0'),
      });
    }

    return transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.created_at * 1000);
      const hour = date.getHours().toString().padStart(2, '0');

      const currentHour = acc.find(item => item.hour === hour);
      if (currentHour) currentHour.count = currentHour.count + 1;
      return acc;
    }, transactionCountByHour);
  }

  return useQuery({
    queryKey: ['xCallStats'],
    queryFn: async () => {
      const txBatches: any[] = [];

      for (let i = 0; i < 10; i++) {
        const txs: any[] = await getTxs(i * 100, 100);
        const last24hoursIndex = txs.findIndex(tx => tx.created_at * 1000 < yesterdayTimestamp);
        if (last24hoursIndex >= 0) {
          txs.splice(last24hoursIndex);
          txBatches.push(...txs);
          break;
        }

        txBatches.push(...txs);
      }

      const filtered = txBatches.filter(tx => tx.status === 'executed');

      const transactionsByHour = countTransactionsByHour(filtered);
      return {
        transactionCount: filtered.length,
        data: transactionsByHour,
      };
    },

    placeholderData: keepPreviousData,
    refetchInterval: 100000,
  });
}
