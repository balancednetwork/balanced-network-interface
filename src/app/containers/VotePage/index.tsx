import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useFetchUserVoteData } from 'store/liveVoting/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

import BribesPanel from './BribesPanel';
import LiveVotingPanel from './LieVotingPanel';
import ProposalsPanel from './ProposalsPanel';
import VotingPowerPanel from './VotingPowerPanel';

const MemoizedVotingPanel = React.memo(LiveVotingPanel);

export function VotePage() {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account, accountArch);
  useFetchRewardsInfo();
  useFetchUserVoteData();

  return (
    <Flex flexDirection="column" width="100%">
      <VotingPowerPanel />
      <ProposalsPanel />
      <BribesPanel />
      <MemoizedVotingPanel />
    </Flex>
  );
}
