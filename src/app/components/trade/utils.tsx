import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { HEIGHT } from 'app/components/TradingViewChart';
import { ZERO } from 'constants/misc';

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

export function transferAssetMessage(inputAmount: string, inputCurrency: string, address: string, network: string) {
  const pendingMessage = t`Transfer ${inputCurrency} to ${network}...`;
  const successMessage = t`Transfer ${inputAmount} ${inputCurrency} to ${network} with ${address}.`;
  const failureMessage = t`Couldn't transfer ${inputCurrency} to ${network}. Try again.`;
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

export const ChartContainer = styled(Box)`
  position: relative;
  height: ${HEIGHT}px;
`;

export const ChartControlGroup = styled(Box)`
  text-align: left;

  ${({ theme }) => theme.mediaWidth.upSmall`
    text-align: right;
  `}

  & button {
    margin-right: 5px;
  }

  & button:last-child {
    margin-right: 0;
  }
`;

export const ChartControlButton = styled(Button)<{ active?: boolean }>`
  padding: 1px 12px;
  border-radius: 100px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.bg3)};
  transition: background-color 0.3s ease;

  :hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 1px 12px;
  `}
`;
export const stakedFraction = stakedLPPercent => {
  const [stakedNumerator, stakedDenominator] = stakedLPPercent ? stakedLPPercent.toFraction() : [0, 1];
  const stakedFraction = new Fraction(stakedNumerator.toFixed(), stakedDenominator.toFixed());
  return stakedFraction;
};

export const totalSupply = (stakedValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) =>
  !!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue;

export const getFormattedRewards = (reward: BigNumber): string => {
  return reward?.isEqualTo(ZERO) ? 'N/A' : `~ ${reward.toFormat(2)} BALN`;
};
