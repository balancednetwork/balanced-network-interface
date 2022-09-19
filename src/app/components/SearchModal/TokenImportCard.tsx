import React from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { useIconReact } from 'packages/icon-react';
import { Card } from 'rebass';
import styled from 'styled-components';

import { AutoColumn } from 'app/components/Column';
import { Typography } from 'app/theme';
import { getTrackerLink } from 'utils';

import { ExternalLink } from './components';

const AddressText = styled(Typography)`
  word-break: break-all;
`;
interface TokenImportCardProps {
  token: Token;
}

const TokenImportCard = ({ token }: TokenImportCardProps) => {
  const { networkId: chainId } = useIconReact();
  return (
    <Card>
      <AutoColumn gap="10px" justify="center">
        <AutoColumn gap="4px" justify="center">
          <Typography ml="8px" mr="8px" fontWeight="bold" fontSize={20} color="white">
            {token.symbol}
          </Typography>
          <Typography fontSize={16} color="white">
            {token.name}
          </Typography>
        </AutoColumn>
        {chainId && (
          <ExternalLink href={getTrackerLink(chainId, token.address, 'contract')}>
            <AddressText fontSize={14} width={180} textAlign="center">
              {token.address}
            </AddressText>
          </ExternalLink>
        )}
      </AutoColumn>
    </Card>
  );
};

export default TokenImportCard;
