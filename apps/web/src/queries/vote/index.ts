import * as React from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery, UseQueryResult } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';
import { usePlatformDayQuery } from 'queries/reward';
import { useAllTransactions } from 'store/transactions/hooks';
import { ProposalInterface } from 'types';

export const useProposalInfoQuery = (pId: number) => {
  return useQuery<ProposalInterface | undefined>(QUERY_KEYS.Vote.VoteInfo(pId), async () => {
    const res = await bnJs.Governance.checkVote(pId);
    if (!res.id) return;
    const _against = BalancedJs.utils.toIcx(res['against']);
    const _for = BalancedJs.utils.toIcx(res['for']);

    const _against1 = _against.isZero() ? 0 : _against.div(_against.plus(_for)).times(100).dp(2).toNumber();
    const _for1 = _for.isZero() ? 0 : _for.div(_against.plus(_for)).times(100).dp(2).toNumber();

    return {
      id: parseInt(res.id, 16),
      name: res['name'],
      description: res['description'],
      proposer: res['proposer'],
      against: _against1,
      for: _for1,
      snapshotBlock: parseInt(res['vote snapshot'], 16),
      startDay: parseInt(res['start day'], 16),
      endDay: parseInt(res['end day'], 16),
      majority: BalancedJs.utils.toIcx(res['majority']).times(100).dp(2).toNumber(),
      quorum: BalancedJs.utils.toIcx(res['quorum']).times(100).dp(2).toNumber(),
      sum: _against.plus(_for).times(100).dp(2).toNumber(),
      uniqueApproveVoters: parseInt(res['for_voter_count'], 16),
      uniqueRejectVoters: parseInt(res['against_voter_count'], 16),
      voters: parseInt(res['for_voter_count'], 16) + parseInt(res['against_voter_count'], 16),
      status: res['status'],
      actions: res['actions'],
      forumLink: res['forum link'],
    };
  });
};

export const useUserVoteStatusQuery = (pId?: number) => {
  const { account } = useIconReact();

  return useQuery<{
    hasVoted: boolean;
    reject: BigNumber;
    approval: BigNumber;
  }>(
    QUERY_KEYS.Vote.UserVoteStatus(pId || 0, account ?? ''),
    async () => {
      const res = await bnJs.Governance.getVotesOfUser(pId!, account!);
      const approval = BalancedJs.utils.toIcx(res['for']);
      const reject = BalancedJs.utils.toIcx(res['against']);

      return {
        hasVoted: !(approval.isZero() && reject.isZero()),
        approval: approval,
        reject: reject,
      };
    },
    {
      enabled: !!account && !!pId,
    },
  );
};

export const useUserWeightQuery = (block?: number) => {
  const { account } = useIconReact();

  return useQuery<BigNumber>(
    QUERY_KEYS.Vote.UserWeight(account ?? ''),
    async () => {
      const res = await bnJs.Governance.myVotingWeight(account!, block!);
      return BalancedJs.utils.toIcx(res);
    },
    {
      enabled: !!account && !!block,
    },
  );
};

export const useTotalStakedBalanceAtQuery = (day?: number) => {
  return useQuery<BigNumber>(
    QUERY_KEYS.Vote.TotalStakedBalanceAt(day ?? 0),
    async () => {
      const res = await bnJs.BALN.totalStakedBalanceOfAt(day!);
      return BalancedJs.utils.toIcx(res);
    },
    {
      enabled: !!day,
    },
  );
};

export const useTotalCollectedFeesQuery = () => {
  return useQuery<{ [key in string]: BigNumber }>(QUERY_KEYS.Vote.TotalCollectedFees, async () => {
    const data = await bnJs.Dividends.getBalances();
    const t = {};
    Object.keys(data).forEach(key => {
      t[key] = BalancedJs.utils.toIcx(data[key]);
    });
    return t;
  });
};

export const useProposalCount = (): UseQueryResult<number> => {
  return useQuery('proposalCounts', async () => {
    const res = await bnJs.Governance.getTotalProposal();
    return (parseInt(res, 16) || -1) + 1;
  });
};

export const useTotalProposalQuery = (offset: number = 0, batchSize: number = 20) => {
  const { data: proposalCount } = useProposalCount();

  return useQuery<Array<ProposalInterface>>(
    [QUERY_KEYS.Vote.TotalProposals, proposalCount, offset, batchSize],
    async () => {
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
    {
      keepPreviousData: true,
      enabled: !!proposalCount,
    },
  );
};

export const useTotalProposalCountQuery = () => {
  return useQuery<number>(QUERY_KEYS.Vote.TotalProposalsCount, async () => {
    const res = await bnJs.Governance.getTotalProposal();
    return parseInt(res, 16);
  });
};

export const useActiveProposals = () => {
  const { account } = useIconReact();
  const { data: platformDay } = usePlatformDayQuery();
  const transactions = useAllTransactions();
  const txCount = React.useMemo(() => (transactions ? Object.keys(transactions).length : 0), [transactions]);
  const { data: proposals } = useTotalProposalQuery();

  return useQuery(
    `activeProposals-${proposals ? proposals.length : ''}-${account}-${txCount}-${platformDay}`,
    async () => {
      if (account && proposals) {
        const activeProposals = await Promise.all(
          proposals.map(async proposal => {
            if (
              platformDay &&
              proposal.status === 'Active' &&
              proposal.startDay <= platformDay &&
              proposal.endDay > platformDay
            ) {
              const res = await bnJs.Governance.getVotesOfUser(proposal.id, account!);
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
      }
    },
    {
      enabled: !!account && !!platformDay && !!proposals,
    },
  );
};

export const useMinBBalnPercentageToSubmit = () => {
  return useQuery<BigNumber, Error>('minBbalnRequired', async () => {
    const points = await bnJs.Governance.getBalnVoteDefinitionCriterion();
    return new BigNumber(points || 0).div(10000);
  });
};
