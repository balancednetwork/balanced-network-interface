import React from 'react';

import { Trans } from '@lingui/macro';
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

  return (
    <>
      {shouldLedgerSign && (
        <MessageBox {...props}>
          <Trans>Confirm the transaction on your Ledger.</Trans>
        </MessageBox>
      )}
    </>
  );
}
