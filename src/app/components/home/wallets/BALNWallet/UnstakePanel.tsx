import React from 'react';

import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';

import { Typography } from 'app/theme';
import { useBALNDetails } from 'store/wallet/hooks';

import { Grid } from '../utils';

export default function UnstakePanel() {
  const details = useBALNDetails();

  const unstakingBalance: BigNumber = details['Unstaking balance'] || new BigNumber(0);
  const unstakingTime: BigNumber | undefined = details['Unstaking time (in microseconds)'];
  const unstakingDate = unstakingTime && new Date(unstakingTime.div(1000).integerValue().toNumber());

  return (
    <>
      <Grid>
        <Typography variant="h3">Unstaking</Typography>

        {unstakingBalance.isZero() ? (
          <Typography>There's no BALN unstaking.</Typography>
        ) : (
          <>
            <Typography>
              {`Your BALN will unstake on ${unstakingDate && dayjs(unstakingDate).format('MMM d')} at
                ${unstakingDate && dayjs(unstakingDate).format('h:maaa')}.`}
            </Typography>

            <Typography variant="p">{unstakingBalance.dp(2).toFormat()} BALN unstaking</Typography>
          </>
        )}
      </Grid>
    </>
  );
}
