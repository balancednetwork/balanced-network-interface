import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Card } from 'rebass';
import styled, { useTheme } from 'styled-components';

import { AutoColumn } from 'app/components/Column';
import { Typography } from 'app/theme';
import { Token } from 'types/balanced-sdk-core';
import { getTrackerLink } from 'utils';

import { ExternalLink } from './components';

const AddressText = styled(Typography)`
  word-break: break-all;
`;
interface TokenImportCardProps {
  token: Token;
}

const TokenImportCard = ({ token }: TokenImportCardProps) => {
  const theme = useTheme();
  const { networkId: chainId } = useIconReact();
  return (
    <Card backgroundColor={theme.colors.bg2} padding="1rem">
      <AutoColumn gap="10px" justify="center">
        <AutoColumn gap="4px" justify="center">
          <Typography ml="8px" mr="8px" fontWeight="bold" fontSize={24}>
            {token.symbol}
          </Typography>
          <Typography fontSize={20}>{token.name}</Typography>
        </AutoColumn>
        {chainId && (
          <ExternalLink href={getTrackerLink(chainId, token.address, 'address')}>
            <AddressText fontSize={14}>{token.address}</AddressText>
          </ExternalLink>
        )}
      </AutoColumn>
    </Card>
  );
};

export default TokenImportCard;
