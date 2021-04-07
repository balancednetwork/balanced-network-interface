import React from 'react';

import BigNumber from 'bignumber.js';

import { Typography } from 'app/theme';
import { useBALNDetails } from 'store/wallet/hooks';

import { Grid } from '../utils';

export default function UnstakePanel() {
  const details = useBALNDetails();

  const unstakingBalance: BigNumber = details['Unstaking balance'] || new BigNumber(0);

  return (
    <>
      <Grid>
        <Typography variant="h3">Unstaking</Typography>

        {unstakingBalance.isZero() ? (
          <Typography>There's no BALN unstaking.</Typography>
        ) : (
          <>
            <Typography>Your BALN will unstake within 3 days.</Typography>

            <Typography variant="p">{unstakingBalance.dp(2).toFormat()} BALN unstaking</Typography>
          </>
        )}
      </Grid>
    </>
  );
}
