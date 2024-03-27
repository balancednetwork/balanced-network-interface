import React from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { AutoColumn } from 'app/components/Column';
import { Typography } from 'app/theme';
import { useAddUserToken } from 'store/user/hooks';

import TokenImportCard from './TokenImportCard';

interface ImportProps {
  tokens: Token[];
  onBack?: () => void;
  onDismiss?: () => void;
  handleCurrencySelect?: (currency: Currency) => void;
}

export function ImportToken(props: ImportProps) {
  const { tokens, onDismiss, handleCurrencySelect } = props;

  const addToken = useAddUserToken();

  return (
    <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
      <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
        Import asset?
      </Typography>

      <AutoColumn gap="md">
        {tokens.map(token => (
          <TokenImportCard token={token} key={'import' + token.address} />
        ))}
        <Typography color="alert" textAlign="center" mb={1} mx={4}>
          Make sure these details are correct before you add it to Balanced on this device.{' '}
        </Typography>

        <Flex justifyContent="center" pt={3} className="border-top">
          <TextButton onClick={onDismiss}>Cancel</TextButton>
          <Button
            fontSize={14}
            onClick={() => {
              tokens.map(token => addToken(token));
              handleCurrencySelect && handleCurrencySelect(tokens[0]);
            }}
          >
            Import
          </Button>
        </Flex>
      </AutoColumn>
    </Flex>
  );
}
