import BigNumber from 'bignumber.js';
import { IconHexadecimal } from 'icon-sdk-js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';
import { VoteInterface } from 'types';
import { getProposal } from 'utils';

export const useVoteInfoQuery = (voteIndex: number) => {
  return useQuery<VoteInterface | undefined>(QUERY_KEYS.Vote.VoteInfo(voteIndex), async () => {
    return getProposal(voteIndex);
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

export const useTotalProposalQuery = () => {
  return useQuery<Array<VoteInterface>>(QUERY_KEYS.Vote.TotalProposals, async () => {
    const res = await bnJs.Governance.getTotalProposal();
    const totalProposal = parseInt(IconHexadecimal.remove0xPrefix(res));
    const promises: Array<any> = [];
    for (let i = 1; i < totalProposal + 1; i += 1) {
      promises.push(getProposal(i));
    }
    return await Promise.all(promises);
  });
};
