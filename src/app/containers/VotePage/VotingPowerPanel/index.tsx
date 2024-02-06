import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';

import BBalnSlider from 'app/components/home/BBaln/BBalnSlider';
import { BoostedBox, BoostedInfo } from 'app/components/home/BBaln/styledComponents';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { useTotalBalnLocked, useTotalSupply } from 'store/bbaln/hooks';

import { LoaderComponent } from '../styledComponents';
import { maxYearsLocked } from '../utils';

export default function VotingPowerPanel() {
  const { account } = useIconReact();
  const totalSupply = useTotalSupply();
  const { data: totalLocked } = useTotalBalnLocked();

  const averageLockTime = totalSupply && totalLocked && maxYearsLocked.times(totalSupply.div(totalLocked));

  return (
    <BoxPanel bg="bg2" width="100%">
      {account && (
        <BBalnSlider
          title="Voting power"
          titleVariant="h2"
          lockupNotice="Lock up BALN to hold voting power."
          sliderBg="#144a68"
        />
      )}
      <BoostedInfo showBorder={!!account}>
        <BoostedBox>
          <Typography fontSize={16} color="#FFF">
            {totalSupply ? `${totalSupply.toFormat(0)} bBALN` : <LoaderComponent />}
          </Typography>
          <Typography>
            <Trans>Total voting power</Trans>
          </Typography>
        </BoostedBox>
        <BoostedBox>
          <Typography fontSize={16} color="#FFF">
            {totalLocked ? `${totalLocked.toFormat(0)} BALN` : <LoaderComponent />}
          </Typography>
          <Typography>
            <Trans>Total locked</Trans>
          </Typography>
        </BoostedBox>
        <BoostedBox className="no-border">
          <Typography fontSize={16} color="#FFF">
            {averageLockTime ? `${averageLockTime.toFixed(2)} years` : <LoaderComponent />}
          </Typography>
          <Typography>
            <Trans>Average lock-up time</Trans>
          </Typography>
        </BoostedBox>
      </BoostedInfo>
    </BoxPanel>
  );
}
