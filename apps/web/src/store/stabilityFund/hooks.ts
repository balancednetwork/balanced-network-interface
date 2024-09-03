import { CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import useInterval from '@/hooks/useInterval';
import { useBnJsContractQuery } from '@/queries/utils';
import { AppState } from '@/store';
import { formatUnits } from '@/utils';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { setBalances } from './reducer';

const stabilityFundAddress = bnJs.StabilityFund.address;

export function useStabilityFundBalances(): { [key: string]: CurrencyAmount<Token> } {
  return useSelector((state: AppState) => state.stabilityFund.balances);
}

export async function getAcceptedTokens(): Promise<string[]> {
  const acceptedTokens = await bnJs.StabilityFund.getAcceptedTokens();
  return acceptedTokens;
}

export async function fetchStabilityFundBalances(
  tokenAddresses: string[],
): Promise<{ [key: string]: CurrencyAmount<Token> }> {
  const cds = tokenAddresses.map(address => {
    return {
      target: address,
      method: 'balanceOf',
      params: [stabilityFundAddress],
    };
  });

  const data = await bnJs.Multicall.getAggregateData(cds);

  const balances = {};
  data.forEach((balance, index) => {
    const address = tokenAddresses[index];
    const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address] as Token;
    if (token) {
      balances[address] = CurrencyAmount.fromRawAmount<Token>(token, balance);
    }
  });

  return balances;
}

export function useWhitelistedTokenAddresses(): string[] {
  const { data } = useBnJsContractQuery<string[]>('StabilityFund', 'getAcceptedTokens', [], false);
  return data || [];
}

export function useFetchStabilityFundBalances(): void {
  const dispatch = useDispatch();
  const whitelistedTokens = useWhitelistedTokenAddresses() || [];

  const fetch = async () => {
    const cds: CallData[] = whitelistedTokens.map(address => {
      return {
        target: address,
        method: 'balanceOf',
        params: [stabilityFundAddress],
      };
    });

    const data: string[] = await bnJs.Multicall.getAggregateData(cds);

    const balances: { [key: string]: CurrencyAmount<Token> } = {};
    data.forEach((balance, index) => {
      const address = whitelistedTokens[index];
      const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address] as Token;
      if (token) {
        balances[address] = CurrencyAmount.fromRawAmount<Token>(token, balance);
      }
    });

    dispatch(setBalances({ balances }));
  };

  useInterval(fetch, 3000);
}

export function useFundLimits(): UseQueryResult<{ [key: string]: CurrencyAmount<Token> }> {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];

  return useQuery<{ [key: string]: CurrencyAmount<Token> }>({
    queryKey: [`useFundLimitsQuery`, whitelistedTokenAddresses.length],
    queryFn: async () => {
      const cds: CallData[] = whitelistedTokenAddresses.map(address => {
        return {
          target: stabilityFundAddress,
          method: 'getLimit',
          params: [address],
        };
      });

      const data: string[] = await bnJs.Multicall.getAggregateData(cds);

      const limits = {};
      data.forEach((limit, index) => {
        const address = whitelistedTokenAddresses[index];
        const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address] as Token;
        if (token) {
          limits[address] = CurrencyAmount.fromRawAmount(token, limit);
        }
      });

      return limits;
    },
  });
}
