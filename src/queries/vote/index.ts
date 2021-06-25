import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import QUERY_KEYS from 'queries/queryKeys';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';

export const useVoteInfoQuery = (voteIndex: number) => {
  return useQuery<
    | {
        id: number;
        against: number;
        for: number;
        snapshotDay: number;
        startDay: number;
        endDay: number;
        name: string;
      }
    | undefined
  >(QUERY_KEYS.Vote.VoteInfo(voteIndex), async () => {
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

export const usePlatformDayQuery = (day?: number) => {
  return useQuery<number>(QUERY_KEYS.Vote.PlatformDay, async () => {
    const res = await bnJs.Governance.getDay();
    return parseInt(res, 16);
  });
};
