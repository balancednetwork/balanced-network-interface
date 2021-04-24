import React from 'react';

import styled from 'styled-components';

const StyledMessage = styled.p`
  padding-top: 5px;
  text-align: center;
  margin-top: 0px;
  margin-bottom: 0px;
  color: white;
`;

export default function ShouldLedgerConfirmMessage() {
  return (
    <StyledMessage className="label text-center text-white">Confirm the transaction on your Ledger.</StyledMessage>
  );
}
