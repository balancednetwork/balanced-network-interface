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
  History: {
    AllTransactions: (page: number, limit: number, account: string | undefined) => [
      'History',
      'AllTransactions',
      page,
      limit,
      account,
    ],
  },
};

export default QUERY_KEYS;
