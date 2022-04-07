import React from 'react';

import { t, Trans } from '@lingui/macro';
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
        <Typography variant="h3">
          <Trans>Unstaking</Trans>
        </Typography>

        {unstakingBalance.isZero() ? (
          <Typography>
            <Trans>There's no BALN unstaking.</Trans>
          </Typography>
        ) : (
          <>
            <Typography>
              {t`Your BALN will unstake on ${unstakingDate && dayjs(unstakingDate).format('MMM D')} at
                ${unstakingDate && dayjs(unstakingDate).format('hh:mma')}.`}
            </Typography>

            <Typography variant="p">{t`${unstakingBalance.dp(2).toFormat()} BALN unstaking`}</Typography>
          </>
        )}
      </Grid>
    </>
  );
}
