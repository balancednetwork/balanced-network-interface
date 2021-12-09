import React from 'react';

import { ArrowLeft } from 'react-feather';
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

  const addToken = useAddUserToken();

  return (
    <Wrapper>
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div />}
          <Typography>Import asset?</Typography>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
        </RowBetween>
      </PaddedColumn>

      <AutoColumn gap="md" style={{ marginBottom: '32px', padding: '1rem' }}>
        {tokens.map(token => (
          <TokenImportCard token={token} key={'import' + token.address} />
        ))}
        <AutoColumn justify="center" style={{ textAlign: 'center', gap: '16px', padding: '1rem' }}>
          <Typography color="alert">
            Make sure these details are correct before you add it to Balanced on this device.{' '}
          </Typography>
        </AutoColumn>
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
