import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useFetchUserVoteData } from 'store/liveVoting/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

import LiveVotingPanel from './LiveVotingPanel';
import ProposalsPanel from './ProposalsPanel';
import VotingPowerPanel from './VotingPowerPanel';

const MemoizedVotingPanel = React.memo(LiveVotingPanel);

export function VotePage() {
  const { account } = useIconReact();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account);
  useFetchRewardsInfo();
  useFetchUserVoteData();

  return (
    <Flex flexDirection="column" width="100%">
      <VotingPowerPanel />
      <ProposalsPanel />
      <MemoizedVotingPanel />
    </Flex>
  );
}
