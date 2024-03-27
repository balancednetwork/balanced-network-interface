import React from 'react';

import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import axios from 'axios';
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
  CurrentXCallStateType,
} from 'app/_xcall/types';
import { getArchwayCounterToken } from 'app/_xcall/utils';
import { NETWORK_ID } from 'constants/config';
import { AppState } from 'store';
import { ONE_DAY_DURATION } from 'utils';

import {
  addXCallDestinationEvent,
  addXCallOriginEvent,
  flagRollBackReady,
  removeXCallDestinationEvent,
  removeXCallEvent,
  removeXCallOriginEvent,
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

export function useXCallChainState(chain: SupportedXCallChains): XCallChainState {
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

export type xCallActivityDataType = {
  hour: string;
  count: number;
};

export function useXCallStats(): UseQueryResult<{ transactionCount: number; data: xCallActivityDataType[] }> {
  const IBC_HANDLER_CX = 'cx622bbab73698f37dbef53955fd3decffeb0b0c16';
  const yesterdayTimestamp = (new Date().getTime() - ONE_DAY_DURATION) * 1000;

  async function getTxs(skip: number) {
    const response = await axios.get(
      `${CHAIN_INFO[NETWORK_ID].tracker}/api/v1/transactions/address/${IBC_HANDLER_CX}?addr=${IBC_HANDLER_CX}&limit=100&skip=${skip}`,
    );
    return response.data;
  }

  function countTransactionsByHour(transactions: { block_timestamp: number }[]): xCallActivityDataType[] {
    const transactionCountByHour: { count: number; hour: string }[] = [];

    const yesterdayDate = new Date(yesterdayTimestamp / 1000);
    const currentHour = yesterdayDate.getHours();

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i + 1) % 24;
      transactionCountByHour.push({
        count: 1,
        hour: hour.toString().padStart(2, '0'),
      });
    }

    return transactions.reduce((acc, transaction) => {
      const date = new Date(Math.floor(transaction.block_timestamp / 1000));
      const hour = date.getHours().toString().padStart(2, '0');

      const currentHour = acc.find(item => item.hour === hour);
      currentHour && (currentHour.count = currentHour.count + 1);
      return acc;
    }, transactionCountByHour);
  }

  return useQuery(
    'xCallStats',
    async () => {
      const txBatches = await Promise.all([getTxs(0), getTxs(100), getTxs(200), getTxs(300), getTxs(400)]);
      const txs = txBatches.flat();
      const oldTxIndex = txs.findIndex(tx => tx.block_timestamp < yesterdayTimestamp + 3600000000);
      const relevantTxs = txs.slice(0, oldTxIndex);
      const xCallTransactions = relevantTxs.filter(
        tx => tx.method === 'recvPacket' || tx.method === 'acknowledgePacket',
      );

      return {
        transactionCount: xCallTransactions.length,
        data: countTransactionsByHour(xCallTransactions),
      };
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000,
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
    { keepPreviousData: true, refetchInterval: 2000, enabled: !!currencyAmount },
  );
}
