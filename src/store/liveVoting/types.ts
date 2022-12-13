import { Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

export type VoteSourceRaw = {
  type: string;
  votable: string;
  weight: string;
};

export type VoteSource = {
  type: number;
  weight: Fraction;
};

export type RewardDistributionRaw = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

export type RewardDistribution = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

export type VoteItemInfoRaw = {
  end: string;
  lastVote: string;
  power: string;
  slope: string;
};

export type VoteItemInfo = {
  end: Date;
  lastVote: Date;
  power: Fraction;
  slope: BigNumber;
};
