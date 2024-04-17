import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex } from 'rebass/styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useFetchUserVoteData } from 'store/liveVoting/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

import BribesPanel from './_components/BribesPanel';
import LiveVotingPanel from './_components/LieVotingPanel';
import ProposalsPanel from './_components/ProposalsPanel';
import VotingPowerPanel from './_components/VotingPowerPanel';

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
