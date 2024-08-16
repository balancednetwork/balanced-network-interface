import { Fraction } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';

import { EXA, WEIGHT } from '@/app/components/home/BBaln/utils';
import { BIGINT_ZERO, FRACTION_ZERO } from '@/constants/misc';
import { BalanceData } from '@/hooks/useV2Pairs';
import { Source } from '@/store/bbaln/hooks';

export function getRate(pair: Pair, balance: BalanceData, stakedRatio = new Fraction(1)): Fraction {
  //When balance = 0, use stakedLPBalance to calculate rate
  if (pair.totalSupply && pair.totalSupply.quotient > BIGINT_ZERO && balance) {
    const amount = (balance?.stakedLPBalance ? balance.balance.add(balance.stakedLPBalance) : balance.balance).divide(
      pair.totalSupply.multiply(stakedRatio),
    );
    return new Fraction(amount.numerator, amount.denominator);
  }
  return FRACTION_ZERO;
}

export function getABBalance(pair: Pair, balance: BalanceData) {
  const rate = getRate(pair, balance);

  return [pair.reserve0.multiply(rate), pair.reserve1.multiply(rate)];
}

export function getShareReward(
  totalReward: BigNumber,
  boostData?: Source,
  userBalances?: BalanceData,
  stakedRatio?: Fraction,
  totalBbalnSupply?: BigNumber,
  userBbalnBalance?: BigNumber,
): BigNumber {
  //handle icx queue
  if (!stakedRatio && boostData) {
    return totalReward.times(boostData.workingBalance.div(boostData.workingSupply));
  }

  //handle standard LPs
  if (boostData && userBalances && stakedRatio && totalBbalnSupply && userBbalnBalance) {
    const stakedFractionNumber = new BigNumber(stakedRatio.toFixed(8)).div(100);
    if (stakedFractionNumber.isEqualTo(0)) {
      return new BigNumber(0);
    }
    const unStakedLPBalance = new BigNumber(userBalances.balance.toExact()).times(
      10 ** userBalances.balance.currency.decimals,
    );
    const max = boostData.balance.times(EXA).div(WEIGHT);
    let boost = new BigNumber(0);
    if (userBbalnBalance.isGreaterThan(0) && boostData.balance.isGreaterThan(0)) {
      boost = boostData.supply.times(userBbalnBalance).times(EXA.minus(WEIGHT)).div(totalBbalnSupply).div(WEIGHT);
    }

    let newBalance = boostData.balance.plus(unStakedLPBalance).times(stakedFractionNumber);
    newBalance = newBalance.plus(boost);
    newBalance = boostData.balance.isGreaterThan(0) ? BigNumber.min(newBalance, max) : newBalance;
    const newWorkingSupply = boostData.workingSupply.minus(boostData.workingBalance).plus(newBalance);
    return totalReward.times(newBalance.div(newWorkingSupply));
  }

  return new BigNumber(0);
}
