import { useRef } from 'react';

import BigNumber from 'bignumber.js';
import { Converter as IconConverter } from 'icon-sdk-js';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { useBnJsContractQuery } from 'queries/utils';
import { useBlockNumber } from 'store/application/hooks';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { toCurrencyAmountFromRawBN } from 'utils';

interface StabilityFundState {
  //true if swap input/output is compatible with fund
  isSwapEligible: boolean;

  //true if swap input/output is compatible with fund and swap has no errors
  isFundUsable: boolean;

  //true if fund have enough balance of swap output token
  hasFundEnoughBalance: boolean;
}

const bnUSDAddress = bnJs.bnUSD.address;
const stabilityFundAddress = bnJs.StabilityFund.address;
const toDec = new BigNumber(10).pow(18);
const toPercent = new BigNumber(10).pow(2);

export function useWhitelistedTokenAddresses(): string[] | undefined {
  const { data } = useBnJsContractQuery<string[]>('StabilityFund', 'getAcceptedTokens', [], false);
  return data;
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

export function useIsFundUsable(): boolean {
  const { inputError } = useDerivedSwapInfo();
  const isSwapEligible = useIsSwapEligible();
  return !inputError && isSwapEligible;
}

export function useHasFundEnoughBalance(): boolean {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];
  const { currencies, trade } = useDerivedSwapInfo();
  const { data: fundBalances } = useFundBalances();
  const storedBalances = useRef<{ [key: string]: number } | undefined>();

  if (fundBalances !== undefined) {
    storedBalances.current = fundBalances;
  }

  if (!trade?.outputAmount || !trade?.inputAmount) {
    return false;
  }

  if (currencies.OUTPUT?.isToken && currencies.OUTPUT.address === bnUSDAddress) {
    return true;
  } else if (
    currencies.INPUT?.isToken &&
    currencies.INPUT.address === bnUSDAddress &&
    currencies.OUTPUT?.isToken &&
    whitelistedTokenAddresses.indexOf(currencies.OUTPUT.address) >= 0 &&
    storedBalances.current &&
    storedBalances.current[currencies.OUTPUT.address]
  ) {
    const amountSendToFund = new BigNumber(trade.inputAmount.toFixed(4));
    const amountInFund = new BigNumber(storedBalances.current[currencies.OUTPUT.address].toFixed(4));
    const hasEnough: boolean = amountInFund.isGreaterThan(amountSendToFund);
    return hasEnough;
  } else {
    return false;
  }
}

export function useStabilityFundState(): StabilityFundState {
  const isSwapEligible = useIsSwapEligible();
  const hasFundEnoughBalance = useHasFundEnoughBalance();
  const isFundUsable = useIsFundUsable();

  const state: StabilityFundState = {
    isSwapEligible,
    hasFundEnoughBalance,
    isFundUsable,
  };

  return state;
}

function useFundBalances() {
  const whitelistedTokenAddresses = useWhitelistedTokenAddresses() || [];
  const blockNumber = useBlockNumber();

  return useQuery<{ [key: string]: number }>(`useFundBalancesQuery${blockNumber}`, async () => {
    const tokens: Array<any> = await Promise.all(
      whitelistedTokenAddresses.map(async address => {
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
    return balances;
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
