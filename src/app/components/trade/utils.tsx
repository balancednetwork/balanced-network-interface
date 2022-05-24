import { t } from '@lingui/macro';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

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
