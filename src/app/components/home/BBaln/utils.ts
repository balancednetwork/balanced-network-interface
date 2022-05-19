import { DateOptions, LockedPeriod } from './types';

export const lockingPeriods: LockedPeriod[] = [
  {
    name: '1 week',
    days: 7,
  },
  {
    name: '1 month',
    days: 30,
  },
  {
    name: '3 months',
    days: 91,
  },
  {
    name: '6 months',
    days: 183,
  },
  {
    name: '1 year',
    days: 365,
  },
  {
    name: '2 years',
    days: 730,
  },
  {
    name: '4 years',
    days: 1460,
  },
];

export const dateOptionLong: DateOptions = {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
};

export const formatDate = (date: Date | undefined) =>
  date ? date.toLocaleDateString('en-US', dateOptionLong).replace(',', '') : '';
