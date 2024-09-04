import * as React from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import QUERY_KEYS from '@/queries/queryKeys';
import { usePlatformDayQuery } from '@/queries/reward';
import { useAllTransactions } from '@/store/transactions/hooks';
import { ProposalInterface } from '@/types';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

export const useProposalCount = (): UseQueryResult<number> => {
  return useQuery({
    queryKey: ['proposalCounts'],
    queryFn: async () => {
      const res = await bnJs.Governance.getTotalProposal();
      return (parseInt(res, 16) || -1) + 1;
    },
  });
};

export const useTotalProposalQuery = (offset: number = 0, batchSize: number = 20) => {
  const { data: proposalCount } = useProposalCount();

  return useQuery<Array<ProposalInterface>>({
    queryKey: [QUERY_KEYS.Vote.TotalProposals, proposalCount, offset, batchSize],
    queryFn: async () => {
      const res = await bnJs.Governance.getProposals(
        Math.max((proposalCount as number) - (offset + batchSize), 0),
        batchSize,
      );

      const data = res
        .map(r => {
          const _against = BalancedJs.utils.toIcx(r['against']);
          const _for = BalancedJs.utils.toIcx(r['for']);

          const _against1 = _against.isZero() ? 0 : _against.div(_against.plus(_for)).times(100).dp(2).toNumber();
          const _for1 = _for.isZero() ? 0 : _for.div(_against.plus(_for)).times(100).dp(2).toNumber();

          return {
            id: parseInt(r.id, 16),
            name: r['name'],
            proposer: r['proposer'],
            description: r['description'],
            majority: BalancedJs.utils.toIcx(r['majority']).toNumber(),
            snapshotDay: parseInt(r['vote snapshot'], 16),
            startDay: parseInt(r['start day'], 16),
            endDay: parseInt(r['end day'], 16),
            quorum: BalancedJs.utils.toIcx(r['quorum']).times(100).dp(2).toNumber(),
            for: _for1,
            against: _against1,
            sum: _against.plus(_for).times(100).dp(2).toNumber(),
            uniqueApproveVoters: parseInt(r['for_voter_count'], 16),
            uniqueRejectVoters: parseInt(r['against_voter_count'], 16),
            voters: parseInt(r['for_voter_count'], 16) + parseInt(r['against_voter_count'], 16),
            status: r['status'],
          };
        })
        .filter(r => r.status !== 'Cancelled');
      return data;
    },
    placeholderData: keepPreviousData,
    enabled: !!proposalCount,
  });
};

export const useActiveProposals = () => {
  const { account } = useIconReact();
  const { data: platformDay } = usePlatformDayQuery();
  const transactions = useAllTransactions();
  const txCount = React.useMemo(() => (transactions ? Object.keys(transactions).length : 0), [transactions]);
  const { data: proposals } = useTotalProposalQuery();

  return useQuery({
    queryKey: [`activeProposals`, proposals ? proposals.length : '', account, txCount, platformDay],
    queryFn: async () => {
      if (!account || !platformDay || !proposals) return;

      const activeProposals = await Promise.all(
        proposals.map(async proposal => {
          if (
            platformDay &&
            proposal.status === 'Active' &&
            proposal.startDay <= platformDay &&
            proposal.endDay > platformDay
          ) {
            const res = await bnJs.Governance.getVotesOfUser(proposal.id, account);
            const approval = BalancedJs.utils.toIcx(res['for']);
            const reject = BalancedJs.utils.toIcx(res['against']);
            const hasVoted = !(approval.isZero() && reject.isZero());

            return !hasVoted;
          } else {
            return false;
          }
        }),
      ).then(results => proposals.filter((_proposal, index) => results[index]));

      return activeProposals;
    },
    enabled: !!account && !!platformDay && !!proposals,
  });
};
