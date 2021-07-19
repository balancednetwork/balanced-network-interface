import React from 'react';

import { Box, BoxProps } from 'rebass/styled-components';
import styled from 'styled-components';

import { useShouldLedgerSign } from 'store/application/hooks';

const MessageBox = styled(Box)`
  padding-top: 5px;
  text-align: center;
  color: white;
`;

export default function LedgerConfirmMessage(props: BoxProps) {
  const shouldLedgerSign = useShouldLedgerSign();

  return <>{shouldLedgerSign && <MessageBox {...props}>Confirm the transaction on your Ledger.</MessageBox>}</>;
}
