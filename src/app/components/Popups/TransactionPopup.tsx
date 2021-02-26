import React from 'react';

import styled from 'styled-components';

import { Typography } from 'app/theme';

import { AutoColumn } from '../Column';
import { AutoRow } from '../Row';

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`;

export default function TransactionPopup({
  hash,
  success,
  summary,
}: {
  hash: string;
  success?: boolean;
  summary?: string;
}) {
  return (
    <RowNoFlex>
      <AutoColumn gap="8px">
        <Typography variant="p" fontWeight={500}>
          {summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}
        </Typography>
      </AutoColumn>
    </RowNoFlex>
  );
}
