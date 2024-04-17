import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';

import { DateOptions, LockedPeriod } from './types';

export const WEEK_IN_MS = 604800000;
export const MAX_LOCK_MS = 126144000000;
export const EXA = new BigNumber(10 ** 18);
export const WEIGHT = EXA.times(40).dividedBy(100);
export const MAX_BOOST = new BigNumber(2.5);

export const lockingPeriods: LockedPeriod[] = [
  {
    name: '1 week',
    weeks: 1,
  },
  {
    name: '1 month',
    weeks: 4,
  },
  {
    name: '3 months',
    weeks: 13,
  },
  {
    name: '6 months',
    weeks: 26,
  },
  {
    name: '1 year',
    weeks: 52,
  },
  {
    name: '2 years',
    weeks: 104,
  },
  {
    name: '4 years',
    weeks: 208,
  },
];

export const dateOptionLong: DateOptions = {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
};

export const dateOptionFullMonth: DateOptions = {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
};

export const formatDate = (date: Date | undefined, fullMonth?: boolean) =>
  date
    ? date
        .toLocaleDateString(fullMonth ? 'en-GB' : 'en-US', fullMonth ? dateOptionFullMonth : dateOptionLong)
        .replace(',', '')
    : '';

export const getClosestUnixWeekStart = (timestamp: number): Date => {
  const utcTime = dayjs(timestamp).utc();
  const isTimestampPastUnixWeekStart = utcTime.day() > 3;

  const getStartDayTimestamp = (time): Date => {
    return time.hour(0).minute(0).second(0).millisecond(0).toDate();
  };

  if (isTimestampPastUnixWeekStart) {
    return getStartDayTimestamp(utcTime.day(4).add(7, 'day'));
  } else {
    return getStartDayTimestamp(utcTime.day(4));
  }
};

export const comparePeriods = (period1: LockedPeriod, period2: LockedPeriod): number => {
  if (
    getClosestUnixWeekStart(new Date(new Date().setDate(new Date().getDate() + (period1.weeks * 7 - 7))).getTime()) ===
    getClosestUnixWeekStart(new Date(new Date().setDate(new Date().getDate() + (period2.weeks * 7 - 7))).getTime())
  ) {
    return 0;
  } else {
    return (
      getClosestUnixWeekStart(
        new Date(new Date().setDate(new Date().getDate() + (period1.weeks * 7 - 7))).getTime(),
      ).getTime() -
      getClosestUnixWeekStart(
        new Date(new Date().setDate(new Date().getDate() + (period2.weeks * 7 - 7))).getTime(),
      ).getTime()
    );
  }
};

export const getWeekOffsetTimestamp = (weeks: number): number =>
  new Date(new Date().setDate(new Date().getDate() + (weeks * 7 - 7))).getTime();

export const getBbalnAmount = (balnAmount: BigNumber, lockedPeriod: LockedPeriod): BigNumber => {
  const lockTimestamp = getClosestUnixWeekStart(getWeekOffsetTimestamp(lockedPeriod.weeks));
  const durationLeft = lockTimestamp.getTime() - new Date().getTime();
  return balnAmount.times(durationLeft / MAX_LOCK_MS);
};
