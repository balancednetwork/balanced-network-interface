import React, { CSSProperties } from 'react';

import { CheckCircle } from 'react-feather';
import { useTheme } from 'styled-components';
import styled from 'styled-components/macro';

import { Button } from 'app/components/Button';
import { AutoColumn } from 'app/components/Column';
import CurrencyLogo from 'app/components/CurrencyLogo';
import { AutoRow, RowFixed } from 'app/components/Row';
import { Typography } from 'app/theme';
import { useIsTokenActive, useIsUserAddedToken } from 'hooks/Tokens';
import { Token } from 'types/balanced-sdk-core';

const TokenSection = styled.div<{ dim?: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto;
  grid-gap: 16px;
  align-items: center;

  opacity: ${({ dim }) => (dim ? '0.4' : '1')};
`;

const CheckIcon = styled(CheckCircle)`
  height: 16px;
  width: 16px;
  margin-right: 6px;
  stroke: ${({ theme }) => theme.colors.primary};
`;

const NameOverflow = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  font-size: 12px;
`;

export default function ImportRow({
  token,
  style,
  dim,
  showImportView,
  setImportToken,
}: {
  token: Token;
  style?: CSSProperties;
  dim?: boolean;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
}) {
  const theme = useTheme();

  // check if already active on list or local storage tokens
  const isAdded = useIsUserAddedToken(token);
  const isActive = useIsTokenActive(token);

  return (
    <TokenSection style={style}>
      <CurrencyLogo currency={token} size={'24px'} style={{ opacity: dim ? '0.6' : '1' }} />
      <AutoColumn gap="4px" style={{ opacity: dim ? '0.6' : '1' }}>
        <AutoRow>
          <Typography variant="body" fontWeight={500}>
            {token.symbol}
          </Typography>
          <Typography ml="8px" fontWeight={300}>
            <NameOverflow title={token.name}>{token.name}</NameOverflow>
          </Typography>
        </AutoRow>
      </AutoColumn>

      {!isActive && !isAdded ? (
        <Button
          width="fit-content"
          padding="6px 12px"
          fontWeight={500}
          fontSize="14px"
          onClick={() => {
            setImportToken && setImportToken(token);
            showImportView();
          }}
        >
          Import
        </Button>
      ) : (
        <RowFixed style={{ minWidth: 'fit-content' }}>
          <CheckIcon />
          <Typography color={theme.colors.primary}>Active</Typography>
        </RowFixed>
      )}
    </TokenSection>
  );
}
