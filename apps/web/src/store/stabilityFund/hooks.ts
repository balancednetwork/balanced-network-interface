import React, { useMemo } from 'react';

import { CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import JSBI from 'jsbi';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import useInterval from 'hooks/useInterval';
import { useBnJsContractQuery } from 'queries/utils';
import { AppState } from 'store';
import { formatUnits } from 'utils';

import { setBalances } from './actions';

const bnUSDAddress = bnJs.bnUSD.address;
const stabilityFundAddress = bnJs.StabilityFund.address;
const SWAP_DOLLAR_LIMIT_CUSHION = JSBI.BigInt(5);
const TEN = JSBI.BigInt(10);

export function useStabilityFundInfo(): AppState['stabilityFund'] {
  return useSelector((state: AppState) => state.stabilityFund);
}

export function useStabilityFundBalances(): { [key: string]: CurrencyAmount<Token> } {
  return useSelector((state: AppState) => state.stabilityFund.balances);
}

export function useCAMemo(CA: CurrencyAmount<Currency> | undefined) {
  const ref = React.useRef<CurrencyAmount<Currency>>();

  const areCAsConsideredTheSame =
    CA &&
    ref.current &&
    CA.equalTo(ref.current) &&
    CA.currency.wrapped.address === ref.current.currency.wrapped.address;

  React.useEffect(() => {
    if (!areCAsConsideredTheSame) {
      ref.current = CA;
    }
  }, [areCAsConsideredTheSame, CA]);

  return areCAsConsideredTheSame ? ref.current : CA;
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

export function useIsSwapEligible(addressIN: string | undefined, addressOUT: string | undefined): boolean {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses();

  return useMemo(() => {
    if (addressIN && addressOUT) {
      return (
        (whitelistedTokenAddresses.indexOf(addressIN!) >= 0 && addressOUT === bnUSDAddress) ||
        (whitelistedTokenAddresses.indexOf(addressOUT!) >= 0 && addressIN === bnUSDAddress)
      );
    } else {
      return false;
    }
  }, [whitelistedTokenAddresses, addressIN, addressOUT]);
}

export function useMaxSwapSize(
  inputAmount: CurrencyAmount<Currency> | undefined,
  outputAmount: CurrencyAmount<Currency> | undefined,
): CurrencyAmount<Token> | undefined {
  const balances = useStabilityFundBalances();
  const { data: limits } = useFundLimits();
  const isSwapEligible = useIsSwapEligible(
    inputAmount?.currency.wrapped.address,
    outputAmount?.currency.wrapped.address,
  );
  const isBnUSDGoingIn = inputAmount?.currency.symbol === 'bnUSD';

  return useMemo(() => {
    if (isSwapEligible && inputAmount && outputAmount && limits) {
      if (isBnUSDGoingIn && balances) {
        return CurrencyAmount.fromRawAmount(
          inputAmount.currency.wrapped,
          JSBI.multiply(
            balances[outputAmount.currency.wrapped.address].numerator,
            JSBI.exponentiate(TEN, JSBI.BigInt(inputAmount.currency.decimals - outputAmount.currency.decimals)),
          ),
        );
      } else {
        const tokenAddress = inputAmount.currency.wrapped.address;
        return (
          limits[tokenAddress] &&
          balances &&
          balances[tokenAddress] &&
          limits[tokenAddress]
            .subtract(balances[tokenAddress])
            .subtract(
              CurrencyAmount.fromRawAmount(
                inputAmount.currency.wrapped,
                JSBI.multiply(
                  SWAP_DOLLAR_LIMIT_CUSHION,
                  JSBI.exponentiate(TEN, JSBI.BigInt(inputAmount.currency.decimals)),
                ),
              ),
            )
        );
      }
    }
  }, [balances, inputAmount, outputAmount, isBnUSDGoingIn, isSwapEligible, limits]);
}

export function useFeeAmount(inputAmount: CurrencyAmount<Currency> | undefined): CurrencyAmount<Token> | undefined {
  const feeOut = useFeeOut();
  const feeIn = useFeeIn();
  const isBnUSDGoingIn = inputAmount?.currency.symbol === 'bnUSD';
  const fee = isBnUSDGoingIn ? feeOut : feeIn;

  return useMemo(() => {
    if (!!inputAmount && !!fee) {
      return inputAmount.multiply(new Fraction(fee, 1000)).divide(100) as CurrencyAmount<Token>;
    }
  }, [fee, inputAmount]);
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
        if (token) {
          limits[address] = CurrencyAmount.fromRawAmount(token, limit);
        }
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
