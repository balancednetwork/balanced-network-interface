import React from 'react';

import { Flex, FlexProps } from 'rebass/styled-components';
import styled from 'styled-components';

import { useHasEnoughICX } from '@/store/wallet/hooks';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';

interface Props extends FlexProps {
  noCurrencyBalanceErrorMessage?: boolean;
  noMessages?: boolean;
}
export const ModalContentWrapper = styled(Flex)`
  width: 100%;
  align-items: stretch;
  flex-direction: column;
  margin: 25px;
`;

export default function ModalContent(props: Props) {
  // TODO: deprecate
  const hasEnoughICX = useHasEnoughICX();
  const { noCurrencyBalanceErrorMessage, noMessages, children, ...rest } = props;

  return (
    <ModalContentWrapper {...rest}>
      {children}
      {!noMessages && !hasEnoughICX && !noCurrencyBalanceErrorMessage && <CurrencyBalanceErrorMessage mt={3} />}
    </ModalContentWrapper>
  );
}
