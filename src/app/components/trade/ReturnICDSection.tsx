import React from 'react';

import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';

const Grid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 15px;
`;

const ReturnICDSection = () => {
  const [value, setValue] = React.useState('0');

  const handleInput = v => {
    setValue(v);
  };

  return (
    <DropdownText text="Retire bnUSD">
      <Box padding={5} bg="bg4">
        <Grid>
          <Typography variant="h2">Retire bnUSD</Typography>

          <Typography>Sell your bnUSD for $1 of sICX (staked ICX).</Typography>

          <CurrencyInputPanel
            currency={CURRENCYLIST['bnusd']}
            value={value}
            onUserInput={handleInput}
            showMaxButton={false}
            id="return-icd-input"
            bg="bg5"
          />

          <Flex flexDirection="column" alignItems="flex-end">
            <Typography mb={2}>Minimum: 50 bnUSD</Typography>
            <Typography>Wallet: 1672 bnUSD</Typography>
          </Flex>

          <Divider />

          <Flex alignItems="flex-start" justifyContent="space-between">
            <Typography variant="p">Total</Typography>
            <Flex flexDirection="column" alignItems="flex-end">
              <Typography variant="p">0 sICX</Typography>
              <Typography variant="p" color="text1" fontSize={14}>
                ~ 0 sICX
              </Typography>
            </Flex>
          </Flex>
        </Grid>

        <Flex justifyContent="center" mt={5}>
          <Button>Retire bnUSD</Button>
        </Flex>
      </Box>
    </DropdownText>
  );
};

export default ReturnICDSection;
