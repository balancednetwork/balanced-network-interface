import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { ZERO } from '@/constants/misc';
import { PairData } from '@/queries/backendv2';
import { formatBigNumber } from '@/utils';
import { formatBalance, formatSymbol, formatValue } from '@/utils/formatter';

export function swapMessage(inputAmount: string, inputCurrency: string, outputAmount: string, outputCurrency: string) {
  const pendingMessage = t`Swapping ${formatSymbol(inputCurrency)} for ${formatSymbol(outputCurrency)}...`;
  const successMessage = t`Swapped ${inputAmount} ${formatSymbol(inputCurrency)} for ${outputAmount} ${formatSymbol(
    outputCurrency,
  )}.`;
  const failureMessage = t`Couldn't swap ${inputCurrency} for ${outputCurrency}. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function transferAssetMessage(inputAmount: string, inputCurrency: string, address: string, network: string) {
  const pendingMessage = t`Transfer ${inputCurrency} to ${network}...`;
  const successMessage = t`Transfer ${inputAmount} ${inputCurrency} to ${network} with ${address}.`;
  const failureMessage = t`Couldn't transfer ${inputCurrency} to ${network}. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function depositMessage(currency: string, pair: string) {
  const pendingMessage = t`Sending ${formatSymbol(currency)} to the ${pair.replace('wICX', 'ICX')} pool...`;
  const successMessage = t`${formatSymbol(currency)} sent to the ${pair.replace('wICX', 'ICX')} pool.`;
  const failureMessage = t`Couldn't send ${formatSymbol(currency)} to the ${pair.replace(
    'wICX',
    'ICX',
  )} pool. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function supplyMessage(pair: string) {
  const pendingMessage = t`Supplying ${pair.replace('wICX', 'ICX')} liquidity...`;
  const successMessage = t`Supplied ${pair.replace('wICX', 'ICX')} liquidity.`;
  const failureMessage = t`Couldn't supply ${pair.replace('wICX', 'ICX')} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function withdrawMessage(
  inputAmount: string,
  inputCurrency: string,
  outputAmount: string,
  outputCurrency: string,
) {
  const pendingMessage = t`Withdrawing ${formatSymbol(inputCurrency)} / ${formatSymbol(outputCurrency)} liquidity...`;
  const successMessage =
    outputCurrency.toLowerCase() === 'icx'
      ? t`${outputAmount} ${outputCurrency} added to your wallet.`
      : t`${inputAmount} ${formatSymbol(inputCurrency)} and ${outputAmount} ${formatSymbol(
          outputCurrency,
        )} added to your wallet.`;
  const failureMessage = t`Couldn't withdraw ${formatSymbol(inputCurrency)} / ${formatSymbol(
    outputCurrency,
  )} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export const stakedFraction = stakedLPPercent => {
  const [stakedNumerator, stakedDenominator] = stakedLPPercent ? stakedLPPercent.toFraction() : [0, 1];
  const stakedFraction = new Fraction(stakedNumerator.toFixed(), stakedDenominator.toFixed());
  return stakedFraction;
};

export const totalSupply = (withdrawValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) =>
  !!withdrawValue ? suppliedValue?.subtract(withdrawValue) : suppliedValue;

export const getFormattedRewards = (reward: BigNumber, isOnlyReward = true): string => {
  return reward?.isEqualTo(ZERO) ? (isOnlyReward ? 'N/A' : '') : `~ ${formatBigNumber(reward, 'currency')} BALN`;
};

export const getFormattedExternalRewards = (reward: CurrencyAmount<Currency>, price?: string): string => {
  const rewardAmount = new BigNumber(reward.toFixed());
  return rewardAmount?.isEqualTo(ZERO)
    ? 'N/A'
    : `~ ${formatBalance(rewardAmount.toFixed(), price)} ${reward.currency.symbol}`;
};

export const getRewardApr = (reward: CurrencyAmount<Currency>, pair: PairData, price: number): BigNumber => {
  const apr = new BigNumber(reward.toFixed())
    .times(365 * price)
    .div(new BigNumber(pair.stakedRatio.toFixed(18)).times(pair.liquidity))
    .times(100);

  return apr;
};
