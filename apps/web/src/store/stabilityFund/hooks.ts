import { CallData } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { useDispatch } from 'react-redux';

import bnJs from '@/bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import useInterval from '@/hooks/useInterval';
import { useBnJsContractQuery } from '@/queries/utils';

import { setBalances } from './reducer';

const stabilityFundAddress = bnJs.StabilityFund.address;

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
