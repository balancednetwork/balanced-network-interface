import React from 'react';

import { AlertCircle, ArrowLeft } from 'react-feather';
import { useTheme } from 'styled-components';
import styled from 'styled-components/macro';

import { Button } from 'app/components/Button';
import { AutoColumn } from 'app/components/Column';
import { RowBetween } from 'app/components/Row';
import { Typography } from 'app/theme';
import { useAddUserToken } from 'store/user/hooks';
import { Currency, Token } from 'types/balanced-sdk-core';

import { CloseIcon } from './components';
import { PaddedColumn } from './styleds';
import TokenImportCard from './TokenImportCard';

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
`;

interface ImportProps {
  tokens: Token[];
  onBack?: () => void;
  onDismiss?: () => void;
  handleCurrencySelect?: (currency: Currency) => void;
}

export function ImportToken(props: ImportProps) {
  const { tokens, onBack, onDismiss, handleCurrencySelect } = props;
  const theme = useTheme();

  const addToken = useAddUserToken();

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div />}
          <Typography>Import token</Typography>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
        </RowBetween>
      </PaddedColumn>
      {/* <SectionBreak /> */}
      <AutoColumn gap="md" style={{ marginBottom: '32px', padding: '1rem' }}>
        <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', padding: '1rem' }}>
          <AlertCircle size={48} stroke={theme.colors.text2} strokeWidth={1} />
          <Typography fontWeight={400} fontSize={16}>
            This token doesn&apos;t appear on the active token list(s). Make sure this is the token that you want to
            trade.
          </Typography>
        </AutoColumn>
        {tokens.map(token => (
          <TokenImportCard token={token} key={'import' + token.address} />
        ))}
        <Button
          padding="10px 1rem"
          onClick={() => {
            tokens.map(token => addToken(token));
            handleCurrencySelect && handleCurrencySelect(tokens[0]);
          }}
        >
          Import
        </Button>
      </AutoColumn>
    </Wrapper>
  );
}
