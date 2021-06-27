export const QUERY_KEYS = {
  Vote: {
    VoteInfo: (voteIndex: number) => ['Vote', 'VoteInfo', voteIndex],
    UserVoteStatus: (voteIndex: number, walletAddress: string) => ['Vote', 'UserVoteStatus', voteIndex, walletAddress],
    UserWeight: (walletAddress: string) => ['Vote', 'UserWeight', walletAddress],
    PlatformDay: ['Vote', 'PlatformDay'],
  },
};

export default QUERY_KEYS;
