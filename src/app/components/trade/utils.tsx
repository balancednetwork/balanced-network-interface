import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ZERO } from 'constants/index';
import { FRACTION_ZERO } from 'constants/misc';

export const Panel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

export const SectionPanel = styled(Panel)`
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upSmall`
    flex-direction: row;
  `}
`;

export const BrightPanel = styled(Panel)`
  max-width: initial;

  ${({ theme }) => theme.mediaWidth.upSmall`
    max-width: 360px;
  `}
`;

export function swapMessage(inputAmount: string, inputCurrency: string, outputAmount: string, outputCurrency: string) {
  const pendingMessage = t`Swapping ${inputCurrency} for ${outputCurrency}...`;
  const successMessage = t`Swapped ${inputAmount} ${inputCurrency} for ${outputAmount} ${outputCurrency}.`;
  const failureMessage = t`Couldn't swap ${inputCurrency} for ${outputCurrency}. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function depositMessage(currency: string, pair: string) {
  const pendingMessage = t`Sending ${currency} to the ${pair} pool...`;
  const successMessage = t`${currency} sent to the ${pair} pool.`;
  const failureMessage = t`Couldn't send ${currency} to the ${pair} pool. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function supplyMessage(pair: string) {
  const pendingMessage = t`Supplying ${pair} liquidity...`;
  const successMessage = t`Supplied ${pair} liquidity.`;
  const failureMessage = t`Couldn't supply ${pair} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function withdrawMessage(
  inputAmount: string,
  inputCurrency: string,
  outputAmount: string,
  outputCurrency: string,
) {
  const pendingMessage = t`Withdrawing ${inputCurrency} / ${outputCurrency} liquidity...`;
  const successMessage =
    outputCurrency.toLowerCase() === 'icx'
      ? t`${outputAmount} ${outputCurrency} added to your wallet.`
      : t`${inputAmount} ${inputCurrency} and ${outputAmount} ${outputCurrency} added to your wallet.`;
  const failureMessage = t`Couldn't withdraw ${inputCurrency} / ${outputCurrency} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export const stakedFraction = stakedLPPercent => {
  const [stakedNumerator, stakedDenominator] = stakedLPPercent ? stakedLPPercent.toFraction() : [0, 1];
  const stakedFraction = new Fraction(stakedNumerator.toFixed(), stakedDenominator.toFixed());
  return stakedFraction;
};

export const totalSupply = (stakedValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) =>
  !!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue;

export const getFormattedPoolShare = (
  baseValue: CurrencyAmount<Currency>,
  quoteValue: CurrencyAmount<Currency>,
  percent: BigNumber,
  share: Fraction,
  baseCurrencyTotalSupply: CurrencyAmount<Currency> | undefined,
  pair: Pair,
): string =>
  `${
    (baseValue?.equalTo(0) || quoteValue?.equalTo(0)) && percent?.isGreaterThan(ZERO)
      ? share.multiply(100)?.toFixed(4, { groupSeparator: ',' })
      : ((Number(baseCurrencyTotalSupply?.toFixed()) * 100) / Number(pair?.reserve0.toFixed())).toFixed(4)
  }%`;

export const getFormattedRewards = (reward: Fraction, stakedFractionValue: Fraction): string =>
  reward?.equalTo(FRACTION_ZERO)
    ? 'N/A'
    : stakedFractionValue.greaterThan(0)
    ? `~ ${reward.multiply(stakedFractionValue).divide(100).toFixed(2, { groupSeparator: ',' })} BALN`
    : 'N/A';
