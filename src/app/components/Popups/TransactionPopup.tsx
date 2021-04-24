import React from 'react';

import { useIconReact } from 'packages/icon-react';
import styled from 'styled-components';

import { Link } from 'app/components/Link';
import { Typography } from 'app/theme';
import { getTrackerLink } from 'utils';

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
  const { networkId } = useIconReact();

  return (
    <RowNoFlex>
      <AutoColumn gap="8px">
        <Typography variant="p" fontWeight={500}>
          {summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}
          {networkId && (
            <Link href={getTrackerLink(networkId, hash, 'transaction')} target="_blank">
              View on Tracker
            </Link>
          )}
        </Typography>
      </AutoColumn>
    </RowNoFlex>
  );
}
