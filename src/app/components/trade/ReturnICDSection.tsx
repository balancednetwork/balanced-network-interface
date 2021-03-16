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

const RowBetween = styled(Flex)`
  align-items: center;
  justify-content: space-between;
`;

const ReturnICDSection = () => {
  const [value, setValue] = React.useState('0');

  const handleInput = v => {
    setValue(v);
  };

  return (
    <DropdownText text="Retire bnUSD">
      <Box padding={5} bg="bg3">
        <Grid>
          <Typography variant="h2">Return bnUSD</Typography>

          <Typography>Sell your bnUSD for $1 of sICX (staked ICX).</Typography>

          <CurrencyInputPanel
            currency={CURRENCYLIST['bnusd']}
            value={value}
            onUserInput={handleInput}
            showMaxButton={false}
            id="return-icd-input"
          />

          <RowBetween>
            <Typography>Minimum: 50 bnUSD</Typography>
            <Typography>Wallet: 1672 bnUSD</Typography>
          </RowBetween>

          <Divider />

          <RowBetween>
            <Typography variant="p">Total</Typography>
            <Typography variant="p">0 sICX</Typography>
          </RowBetween>
        </Grid>

        <Flex justifyContent="center" mt={5}>
          <Button>Return bnUSD</Button>
        </Flex>
      </Box>
    </DropdownText>
  );
};

export default ReturnICDSection;
