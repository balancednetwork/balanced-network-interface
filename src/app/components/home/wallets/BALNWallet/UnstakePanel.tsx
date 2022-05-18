import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Typography } from 'app/theme';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useBALNDetails } from 'store/wallet/hooks';

import { Grid } from '../utils';

dayjs.extend(localizedFormat);

export default function UnstakePanel() {
  const details = useBALNDetails();

  const unstakingBalance: BigNumber = details['Unstaking balance'] || new BigNumber(0);
  const unstakingTime: BigNumber | undefined = details['Unstaking time (in microseconds)'];
  const unstakingDate = unstakingTime && new Date(unstakingTime.div(1000).integerValue().toNumber());

  const locale = useActiveLocale();
  const languageCode = locale.split('-')[0];

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
              {t`Your BALN will unstake on ${unstakingDate && dayjs(unstakingDate).locale(languageCode).format('ll')} at
                ${unstakingDate && dayjs(unstakingDate).locale(languageCode).format('LT')}.`}
            </Typography>

            <Typography variant="p">{t`${unstakingBalance.dp(2).toFormat()} BALN unstaking`}</Typography>
          </>
        )}
      </Grid>
    </>
  );
}
