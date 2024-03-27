import React from 'react';

import { FlexProps, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { useHasEnoughICX } from 'store/wallet/hooks';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import LedgerConfirmMessage from '../LedgerConfirmMessage';

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
  const hasEnoughICX = useHasEnoughICX();

  return (
    <ModalContentWrapper {...props}>
      {props.children}
      {!props.noMessages && (
        <>
          <LedgerConfirmMessage />
          {!hasEnoughICX && !props.noCurrencyBalanceErrorMessage && <CurrencyBalanceErrorMessage mt={3} />}
        </>
      )}
    </ModalContentWrapper>
  );
}
