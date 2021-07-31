import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';
import { ProposalInterface, VoteInterface } from 'types';

export const useVoteInfoQuery = (voteIndex: number) => {
  return useQuery<VoteInterface | undefined>(QUERY_KEYS.Vote.VoteInfo(voteIndex), async () => {
    const res = await bnJs.Governance.checkVote(voteIndex);
    if (!res.id) return;

    const _against = BalancedJs.utils.toIcx(res['against']);
    const _for = BalancedJs.utils.toIcx(res['for']);

    const _against1 = _against.isZero() ? 0 : _against.div(_against.plus(_for)).times(100).dp(2).toNumber();
    const _for1 = _for.isZero() ? 0 : _for.div(_against.plus(_for)).times(100).dp(2).toNumber();

    return {
      id: parseInt(res.id, 16),
      name: res['name'],
      against: _against1,
      for: _for1,
      snapshotDay: parseInt(res['vote snapshot'], 16),
      startDay: parseInt(res['start day'], 16),
      endDay: parseInt(res['end day'], 16),
      majority: BalancedJs.utils.toIcx(res['majority']).toNumber(),
      quorum: BalancedJs.utils.toIcx(res['quorum']).times(100).dp(2).toNumber(),
      sum: _against.plus(_for).times(100).dp(2).toNumber(),
    };
  });
};

export const useUserVoteStatusQuery = (voteIndex: number) => {
  const { account } = useIconReact();

  return useQuery<{
    hasVoted: boolean;
    reject: BigNumber;
    approval: BigNumber;
  }>(
    QUERY_KEYS.Vote.UserVoteStatus(voteIndex, account ?? ''),
    async () => {
      const res = await bnJs.Governance.getVotesOfUser(voteIndex, account!);
      const approval = BalancedJs.utils.toIcx(res['for']);
      const reject = BalancedJs.utils.toIcx(res['against']);

      return {
        hasVoted: !(approval.isZero() && reject.isZero()),
        approval: approval,
        reject: reject,
      };
    },
    {
      enabled: !!account,
    },
  );
};

export const useUserWeightQuery = (day?: number) => {
  const { account } = useIconReact();

  return useQuery<BigNumber>(
    QUERY_KEYS.Vote.UserWeight(account ?? ''),
    async () => {
      const res = await bnJs.BALN.stakedBalanceOfAt(account!, day!);
      return BalancedJs.utils.toIcx(res);
    },
    {
      enabled: !!account && !!day,
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

export const useTotalProposalQuery = (offset: number, batchSize: number = 20) => {
  return useQuery<Array<ProposalInterface>>(QUERY_KEYS.Vote.TotalProposals, async () => {
    const res = await bnJs.Governance.getProposals(offset, batchSize);
    const data = res.map(r => {
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
        uniqueApproveVoters: parseInt(r['for_voter_count'], 16),
        uniqueRejectVoters: parseInt(r['against_voter_count'], 16),
        status: r['status'],
      };
    });
    return data;
  });
};

export const useProposalDataQuery = (proposalId: number) => {
  return useQuery<ProposalInterface>(QUERY_KEYS.Vote.Proposal, async () => {
    const offset = Math.floor(proposalId / 20) + 1;
    const res = await bnJs.Governance.getProposals(offset);
    const data = res.filter(r => parseInt(r.id, 16) === proposalId);
    const d = data[0];
    const _against = BalancedJs.utils.toIcx(d['against']);
    const _for = BalancedJs.utils.toIcx(d['for']);
    const _against1 = _against.isZero() ? 0 : _against.div(_against.plus(_for)).times(100).dp(2).toNumber();
    const _for1 = _for.isZero() ? 0 : _for.div(_against.plus(_for)).times(100).dp(2).toNumber();

    return {
      id: parseInt(d.id, 16),
      name: d['name'],
      proposer: d['proposer'],
      description: d['description'],
      majority: BalancedJs.utils.toIcx(d['majority']).toNumber(),
      snapshotDay: parseInt(d['vote snapshot'], 16),
      startDay: parseInt(d['start day'], 16),
      endDay: parseInt(d['end day'], 16),
      quorum: BalancedJs.utils.toIcx(d['quorum']).times(100).dp(2).toNumber(),
      for: _for1,
      against: _against1,
      uniqueApproveVoters: parseInt(d['for_voter_count'], 16),
      uniqueRejectVoters: parseInt(d['against_voter_count'], 16),
      status: d['status'],
    };
  });
};
