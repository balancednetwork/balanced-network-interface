import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { transparentize } from 'polished';
import { AlertCircle } from 'react-feather';
import { Card } from 'rebass';
import styled, { useTheme } from 'styled-components';

import { AutoColumn } from 'app/components/Column';
import CurrencyLogo from 'app/components/CurrencyLogo';
import { RowFixed } from 'app/components/Row';
import { Typography } from 'app/theme';
import { Token } from 'types/balanced-sdk-core';
import { getTrackerLink } from 'utils';

import { ExternalLink } from './components';

const WarningWrapper = styled(Card)<{ highWarning: boolean }>`
  background-color: ${({ theme, highWarning }) =>
    highWarning ? transparentize(0.8, theme.colors.alert) : transparentize(0.8, theme.colors.alert)};
  width: fit-content;
`;

const AddressText = styled(Typography)`
  font-size: 12px;
  word-break: break-all;

  ${({ theme }) => theme.mediaWidth.upSmall`
    font-size: 10px;
  `}
`;
interface TokenImportCardProps {
  token: Token;
}

const TokenImportCard = ({ token }: TokenImportCardProps) => {
  const theme = useTheme();
  const { networkId: chainId } = useIconReact();
  return (
    <Card backgroundColor={theme.colors.bg2} padding="2rem">
      <AutoColumn gap="10px" justify="center">
        <CurrencyLogo currency={token} size={'32px'} />
        <AutoColumn gap="4px" justify="center">
          <Typography ml="8px" mr="8px" fontWeight={500} fontSize={20}>
            {token.symbol}
          </Typography>
          <Typography fontWeight={400} fontSize={14}>
            {token.name}
          </Typography>
        </AutoColumn>
        {chainId && (
          <ExternalLink href={getTrackerLink(chainId, token.address, 'address')}>
            <AddressText fontSize={12}>{token.address}</AddressText>
          </ExternalLink>
        )}

        <WarningWrapper padding="4px" highWarning={true}>
          <RowFixed>
            <AlertCircle stroke={theme.colors.alert} size="10px" />
            <Typography color={theme.colors.alert} ml="4px" fontSize="10px" fontWeight={500}>
              Unknown Source
            </Typography>
          </RowFixed>
        </WarningWrapper>
      </AutoColumn>
    </Card>
  );
};

export default TokenImportCard;
