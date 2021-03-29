import React from 'react';

import { Flex } from 'rebass/styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';

import { Grid } from './utils';

export default function BnUSDWallet() {
  return (
    <BoxPanel bg="bg3">
      <Grid>
        <Flex alignItems="center" justifyContent="space-between">
          <Typography variant="h3">Send bnUSD</Typography>
          <Link href="#">Send max</Link>
        </Flex>

        <CurrencyInputPanel
          value="0"
          showMaxButton={false}
          currency={CURRENCYLIST['bnusd']}
          onUserInput={() => null}
          id="swap-currency-output"
        />

        <AddressInputPanel value="" onUserInput={() => null} />
      </Grid>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        <Button>Send</Button>
      </Flex>
    </BoxPanel>
  );
}
