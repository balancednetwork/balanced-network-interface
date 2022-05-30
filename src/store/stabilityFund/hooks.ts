import BigNumber from 'bignumber.js';
import { Converter as IconConverter } from 'icon-sdk-js';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import useInterval from 'hooks/useInterval';
import { useBnJsContractQuery } from 'queries/utils';
import { AppState } from 'store';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { CurrencyAmount, Fraction, Token } from 'types/balanced-sdk-core';
import { toCurrencyAmountFromRawBN } from 'utils';

import { setBalances } from './actions';

const bnUSDAddress = bnJs.bnUSD.address;
const stabilityFundAddress = bnJs.StabilityFund.address;
const toDec = new BigNumber(10).pow(18);
const toPercent = new BigNumber(10).pow(2);
const swapDollarLimitCushion = new BigNumber(3);

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

export function useFetchStabilityFundBalances() {
  const dispatch = useDispatch();
  const whitelistedTokens = useWhitelistedTokenAddresses() || [];

  useInterval(async () => {
    const tokens: Array<any> = await Promise.all(
      whitelistedTokens.map(async address => {
        const balance = await bnJs.getContract(address).balanceOf(stabilityFundAddress);
        return {
          address: address,
          balance: toCurrencyAmountFromRawBN(
            SUPPORTED_TOKENS_LIST.filter(token => token.address === address)[0],
            new BigNumber(balance),
          ),
        };
      }),
    );
    const balances = {};
    tokens.forEach(token => {
      balances[token.address] = token.balance;
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

export function useMaxSwapSize() {
  const balances = useStabilityFundBalances();
  const { data: limits } = useFundLimits();
  const { trade } = useDerivedSwapInfo();
  const isBnUSDGoingIn = trade?.inputAmount.currency.symbol === 'bnUSD';

  if (trade && limits) {
    if (isBnUSDGoingIn) {
      const balance = balances[trade.outputAmount.currency.wrapped.address];
      return balance && new BigNumber(balance.toFixed(2));
    } else {
      const tokenAddress = trade.inputAmount.currency.wrapped.address;
      return (
        limits[tokenAddress] &&
        limits[tokenAddress]?.minus(swapDollarLimitCushion).minus(new BigNumber(balances[tokenAddress].toFixed(2)))
      );
    }
  }
}

export function useFeeAmount() {
  const feeOut = useFeeOut();
  const feeIn = useFeeIn();
  const { trade } = useDerivedSwapInfo();
  const isBnUSDGoingIn = trade?.inputAmount.currency.symbol === 'bnUSD';
  const fee = isBnUSDGoingIn ? feeOut : feeIn;

  if (!!trade && !!fee) {
    return trade.inputAmount.multiply(new Fraction(1, 1 / fee));
  }
}

export function useFundLimits() {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];

  return useQuery<{ [key: string]: BigNumber }>(`useFundLimitsQuery${whitelistedTokenAddresses.length}`, async () => {
    const tokens: Array<any> = await Promise.all(
      whitelistedTokenAddresses.map(async address => {
        const limit = await bnJs.StabilityFund.getLimit(address);
        return {
          address: address,
          limit: new BigNumber(limit).div(
            new BigNumber(10).pow(SUPPORTED_TOKENS_LIST.filter(token => token.address === address)[0].decimals),
          ),
        };
      }),
    );

    const limits = {};
    tokens.forEach(token => {
      limits[token.address] = token.limit;
    });
    return limits;
  });
}

export function useFeeIn() {
  const { data } = useBnJsContractQuery<number>('StabilityFund', 'getFeeIn', [], false);
  return IconConverter.toBigNumber(data || 0)
    .div(toDec.valueOf())
    .div(toPercent.valueOf())
    .toNumber();
}

export function useFeeOut() {
  const { data } = useBnJsContractQuery<number>('StabilityFund', 'getFeeOut', [], false);
  return IconConverter.toBigNumber(data || 0)
    .div(toDec.valueOf())
    .div(toPercent.valueOf())
    .toNumber();
}
