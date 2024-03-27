import { Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

export type VoteSourceRaw = {
  type: string;
  votable: string;
  weight: string;
  currentWeight: string;
  currentBias: string;
  currentSlope: string;
};

export type VoteSource = {
  type: number;
  weight: Fraction;
  currentWeight: Fraction;
  currentBias: BigNumber;
  currentSlope: BigNumber;
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
