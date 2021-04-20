import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

export const Panel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

export const SectionPanel = styled(Panel)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`;

export const BrightPanel = styled(Panel)`
  max-width: 360px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: initial;
  `}
`;

export function swapMessage(inputAmount: string, inputCurrency: string, outputAmount: string, outputCurrency: string) {
  const pendingMessage = `Swapping ${inputCurrency} for ${outputCurrency}...`;
  const successMessage = `Swapped ${inputAmount} ${inputCurrency} for ${outputAmount} ${outputCurrency}.`;
  const failureMessage = `Couldn't swap ${inputCurrency} for ${outputCurrency}. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function depositMessage(currency: string, pair: string) {
  const pendingMessage = `Sending ${currency} to the ${pair} pool...`;
  const successMessage = `${currency} sent to the ${pair} pool.`;
  const failureMessage = `Couldn't send ${currency} to the ${pair} pool. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function supplyMessage(pair: string) {
  const pendingMessage = `Supplying ${pair} liquidity...`;
  const successMessage = `Supplied ${pair} liquidity.`;
  const failureMessage = `Couldn't supply ${pair} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function withdrawMessage(
  inputAmount: string,
  inputCurrency: string,
  outputAmount: string,
  outputCurrency: string,
) {
  const pendingMessage = `Withdrawing ${inputCurrency} / ${outputCurrency} liquidity...`;
  const successMessage =
    outputCurrency.toLowerCase() === 'sicx'
      ? `${inputAmount} ${inputCurrency} added to your wallet.`
      : `${inputAmount} ${inputCurrency} and ${outputAmount} ${outputCurrency} added to your wallet.`;
  const failureMessage = `Couldn't withdraw ${inputCurrency} / ${outputCurrency} liquidity. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}

export function retireMessage(amount: string, currency: string) {
  const pendingMessage = `Retiring bnUSD...`;
  const successMessage = `${amount} ${currency} added to your wallet.`;
  const failureMessage = `Couldn't retire bnUSD. Try again.`;
  return { pendingMessage, successMessage, failureMessage };
}
