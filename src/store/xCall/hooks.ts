import React from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import { COSMOS_NATIVE_AVAILABLE_TOKENS } from 'app/_xcall/_icon/config';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { SUPPORTED_XCALL_CHAINS } from 'app/_xcall/config';
import {
  OriginXCallData,
  DestinationXCallData,
  SupportedXCallChains,
  XCallChainState,
  XCallEventType,
  XCallActivityItem,
} from 'app/_xcall/types';
import { getArchwayCounterToken } from 'app/_xcall/utils';
import { AppState } from 'store';

import {
  addXCallDestinationEvent,
  addXCallOriginEvent,
  flagRollBackReady,
  removeXCallDestinationEvent,
  removeXCallEvent,
  removeXCallOriginEvent,
  rollBackFromOrigin,
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

export function useXCallActivityItems(): UseQueryResult<XCallActivityItem[] | undefined> {
  const xCallState = useXCallState();

  return useQuery(
    ['xCallActivityItems', xCallState],
    async () => {
      if (xCallState) {
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
      }
    },
    {
      enabled: !!xCallState,
      keepPreviousData: true,
    },
  );
}

export function useRollBackFromOrigin(): (chain: SupportedXCallChains, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(rollBackFromOrigin({ chain, sn }));
    },
    [dispatch],
  );
}

export function useFlagRollBackReady(): (chain: SupportedXCallChains, sn: number) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (chain, sn) => {
      dispatch(flagRollBackReady({ chain, sn }));
    },
    [dispatch],
  );
}

export function useXCallStats(): UseQueryResult<{ transfers: number; swaps: number }> {
  return useQuery(
    'xCallStats',
    () => {
      return {
        transfers: 187,
        swaps: 65,
      };
    },
    {
      keepPreviousData: true,
    },
  );
}

export function useWithdrawableNativeAmount(
  chain: SupportedXCallChains,
  currencyAmount?: CurrencyAmount<Token>,
): UseQueryResult<
  | {
      amount: BigNumber;
      fee: BigNumber;
      symbol: string;
    }
  | undefined
> {
  const amount = currencyAmount?.numerator.toString();
  const address = currencyAmount?.currency.wrapped.address;
  const { client } = useArchwayContext();

  return useQuery(
    ['withdrawableNativeAmount', amount, address, chain],
    async () => {
      if (
        client &&
        address &&
        amount &&
        currencyAmount &&
        COSMOS_NATIVE_AVAILABLE_TOKENS.some(token => token.address === address)
      ) {
        if (chain === 'archway') {
          const stakedArchwayAddress = getArchwayCounterToken('sARCH');
          if (stakedArchwayAddress?.address) {
            const response = await client.queryContractSmart(ARCHWAY_CONTRACTS.liquidSwap, {
              simulation: {
                offer_asset: {
                  amount: amount,
                  info: {
                    token: {
                      contract_addr: stakedArchwayAddress?.address,
                    },
                  },
                },
              },
            });

            return {
              amount: new BigNumber(response.return_amount).div(10 ** currencyAmount.currency.decimals),
              fee: new BigNumber(response.commission_amount).div(10 ** currencyAmount.currency.decimals),
              symbol: 'ARCH',
            };
          }
        }
      }
      return undefined;
    },
    { keepPreviousData: true, enabled: !!currencyAmount },
  );
}
