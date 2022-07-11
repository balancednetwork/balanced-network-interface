import React, { CSSProperties } from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { CheckCircle } from 'react-feather';
import { Flex } from 'rebass';
import { useTheme } from 'styled-components';
import styled from 'styled-components/macro';

import { Button } from 'app/components/Button';
import { RowFixed } from 'app/components/Row';
import { Typography } from 'app/theme';
import { useIsTokenActive, useIsUserAddedToken } from 'hooks/Tokens';

const TokenSection = styled.div<{ dim?: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
      <Flex flexDirection="column" alignItems="flex-start">
        <Typography variant="body" fontWeight="bold" color="white" as="div">
          <NameOverflow title={token.name}>{token.name}</NameOverflow>
        </Typography>
        <Typography variant="body">{token.symbol}</Typography>
      </Flex>

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
