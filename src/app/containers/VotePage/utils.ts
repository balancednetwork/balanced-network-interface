import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';

import { getClosestUnixWeekStart } from 'app/components/home/BBaln/utils';
import { VoteItemInfo, VoteSource } from 'store/liveVoting/types';

export const maxYearsLocked = new BigNumber(4);

export const formatFraction = (fraction: Fraction, unit: string = '%'): string =>
  `${new BigNumber(fraction.toFixed(6)).times(100).dp(2, BigNumber.ROUND_HALF_UP).toFixed()}${unit}`;

export const formatFractionAmount = (fraction: Fraction, amount: BigNumber | CurrencyAmount<Token>): string => {
  if (amount instanceof CurrencyAmount) {
    return amount.multiply(fraction).toFixed(0, { groupSeparator: ',' });
  } else {
    return amount.times(new BigNumber(fraction.toFixed(6))).toFormat(0);
  }
};

export const formatVoteWeight = (weight: string) => new BigNumber(parseFloat(weight)).times(100).toNumber();

export const formatTimeLeft = (date: Date): string => {
  const target = dayjs(date);
  const now = dayjs();
  const timeDiff = target.diff(now, 'milliseconds');

  if (timeDiff > 0) {
    const toMinutes = 1000 * 60;
    const toHours = toMinutes * 60;
    const toDays = toHours * 24;
    const daysLeft = Math.floor(timeDiff / toDays);
    const hoursLeft = Math.floor(timeDiff / toHours) % 24;
    const minutesLeft = Math.floor(timeDiff / toMinutes) % 60;
    const formattedString = `${daysLeft ? daysLeft + t`d` + ' ' : ''}${hoursLeft ? hoursLeft + t`h` + ' ' : ''}${
      minutesLeft ? minutesLeft + t`m` : ''
    }`;

    return formattedString || t`less then a minute`;
  } else {
    return '';
  }
};

export const getUserCurrentAllocationFormatted = (item: VoteItemInfo): string => {
  if (item.slope && item.end) {
    return `${item.slope
      .times(item.end.getTime() - new Date().getTime())
      .times(1000)
      .div(10 ** 18)
      .toFormat(0)} bBALN`;
  } else {
    return '0 bBALN';
  }
};

export const getSourceCurrentAllocationFormatted = (item: VoteSource): string => {
  if (item.currentBias && item.currentSlope) {
    return `${item.currentBias
      .plus(item.currentSlope.times(getClosestUnixWeekStart(new Date().getTime()).getTime() - new Date().getTime()))
      .div(10 ** 18)
      .toFormat(0)} bBALN`;
  } else {
    return '0 bBALN';
  }
};
