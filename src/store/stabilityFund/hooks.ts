import { CallData } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import useInterval from 'hooks/useInterval';
import { useBnJsContractQuery } from 'queries/utils';
import { AppState } from 'store';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { formatUnits } from 'utils';

import { setBalances } from './actions';

const bnUSDAddress = bnJs.bnUSD.address;
const stabilityFundAddress = bnJs.StabilityFund.address;
const swapDollarLimitCushion = 5;

export function useStabilityFundInfo(): AppState['stabilityFund'] {
  return useSelector((state: AppState) => state.stabilityFund);
}

export function useStabilityFundBalances(): { [key: string]: CurrencyAmount<Token> } {
  return useSelector((state: AppState) => state.stabilityFund.balances);
}

export function useWhitelistedTokenAddresses(): string[] | undefined {
  const { data } = useBnJsContractQuery<string[]>('StabilityFund', 'getAcceptedTokens', [], false);
  return data;
}

export function useFetchStabilityFundBalances(): void {
  const dispatch = useDispatch();
  const whitelistedTokens = useWhitelistedTokenAddresses() || [];

  useInterval(async () => {
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
      balances[address] = CurrencyAmount.fromRawAmount<Token>(token, balance);
    });

    dispatch(setBalances({ balances }));
  }, 3000);
}

export function useIsSwapEligible(): boolean {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];
  const { currencies } = useDerivedSwapInfo();

  let isEligible = false;
  if (currencies.INPUT?.isToken && currencies.OUTPUT?.isToken) {
    isEligible =
      (whitelistedTokenAddresses.indexOf(currencies.INPUT.address) >= 0 &&
        currencies.OUTPUT.address === bnUSDAddress) ||
      (whitelistedTokenAddresses.indexOf(currencies.OUTPUT.address) >= 0 && currencies.INPUT.address === bnUSDAddress);
  }
  return isEligible;
}

export function useMaxSwapSize(): CurrencyAmount<Token> | undefined {
  const balances = useStabilityFundBalances();
  const { data: limits } = useFundLimits();
  const { trade } = useDerivedSwapInfo();
  const isBnUSDGoingIn = trade?.inputAmount.currency.symbol === 'bnUSD';
  if (trade && limits) {
    if (isBnUSDGoingIn) {
      return CurrencyAmount.fromRawAmount(
        trade.inputAmount.currency.wrapped,
        new BigNumber(balances[trade.outputAmount.currency.wrapped.address].toFixed())
          .times(new BigNumber(10).pow(trade.inputAmount.currency.wrapped.decimals))
          .toFixed(0),
      );
    } else {
      const tokenAddress = trade.inputAmount.currency.wrapped.address;
      return (
        limits[tokenAddress] &&
        limits[tokenAddress]
          .subtract(balances[tokenAddress])
          .subtract(
            CurrencyAmount.fromRawAmount(
              trade.inputAmount.currency.wrapped,
              swapDollarLimitCushion * Math.pow(10, trade.inputAmount.currency.decimals),
            ),
          )
      );
    }
  }
}

export function useFeeAmount(): CurrencyAmount<Token> | undefined {
  const feeOut = useFeeOut();
  const feeIn = useFeeIn();
  const { trade } = useDerivedSwapInfo();
  const isBnUSDGoingIn = trade?.inputAmount.currency.symbol === 'bnUSD';
  const fee = isBnUSDGoingIn ? feeOut : feeIn;

  if (!!trade && !!fee) {
    return trade.inputAmount.multiply(new Fraction(fee, 1000)).divide(100) as CurrencyAmount<Token>;
  }
}

export function useFundLimits(): UseQueryResult<{ [key: string]: CurrencyAmount<Token> }> {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];

  return useQuery<{ [key: string]: CurrencyAmount<Token> }>(
    `useFundLimitsQuery${whitelistedTokenAddresses.length}`,
    async () => {
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
        limits[address] = CurrencyAmount.fromRawAmount(token, limit);
      });

      return limits;
    },
  );
}

function useFeeIn(): string | undefined {
  const { data } = useBnJsContractQuery<string>('StabilityFund', 'getFeeIn', [], false);
  return data && formatUnits(data, 15);
}

function useFeeOut(): string | undefined {
  const { data } = useBnJsContractQuery<string>('StabilityFund', 'getFeeOut', [], false);
  return data && formatUnits(data, 15);
}
