import React from 'react';

import { BoxPanel } from '@/app/components/Panel';
import BALNWithdrawalNotice from '@/app/components/home/RewardsPanel/BALNWithdrawalNotice';
import { Typography } from '@/app/theme';

export default function VotingPowerPanel() {
  return (
    <BoxPanel bg="bg2" width="100%">
      <Typography variant="h2" mb={5}>
        Voting power
      </Typography>
      <BALNWithdrawalNotice variant="voting" />
    </BoxPanel>
  );
}
