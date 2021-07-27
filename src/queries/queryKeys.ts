import { CHART_PERIODS } from 'app/components/TradingViewChart';
import { Field } from 'store/swap/actions';

export const QUERY_KEYS = {
  Vote: {
    VoteInfo: (voteIndex: number) => ['Vote', 'VoteInfo', voteIndex],
    UserVoteStatus: (voteIndex: number, walletAddress: string) => ['Vote', 'UserVoteStatus', voteIndex, walletAddress],
    UserWeight: (walletAddress: string) => ['Vote', 'UserWeight', walletAddress],
    TotalStakedBalanceAt: (day: number) => ['Vote', 'TotalStakedBalanceAt', day],
    TotalCollectedFees: ['Vote', 'TotalCollectedFees'],
  },
  Reward: {
    PlatformDay: ['Reward', 'PlatformDay'],
    UserCollectedFees: (account: string, start: number, end: number) => [
      'Reward',
      'UserCollectedFees',
      account,
      start,
      end,
    ],
    UserReward: (account: string) => ['Reward', 'UserReward', account],
  },
  Swap: {
    PriceChart: (currencyKeys: { [field in Field]?: string }, period: CHART_PERIODS) => [
      'Swap',
      'PriceChart',
      currencyKeys,
      period,
    ],
  },
  History: {
    AllTransactions: (page: number, limit: number, account: string | undefined) => [
      'History',
      'AllTransactions',
      page,
      limit,
      account,
    ],
  },
  PositionDetails: {
    Rebalancing: (account: string, period: string) => ['PositionDetails', 'Rebalancing', account, period],
  },
};

export default QUERY_KEYS;
