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
  const message = `Swapped ${inputAmount} ${inputCurrency} for ${outputAmount} ${outputCurrency}.`;
  return message;
}

export function depositMessage(currency: string, pair: string) {
  const message = `${currency} sent to the ${pair} pool.`;
  return message;
}

export function supplyMessage(amount: string, pair: string) {
  const message = `Supplied ${pair} liquidity.`;
  return message;
}

export function retireMessage(amount: string) {
  const message = `Retired ${amount} bnUSD.`;
  return message;
}
