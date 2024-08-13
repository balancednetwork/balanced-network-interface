//months and days indexed from 0

import { Granularity } from './types';

export const DATES = {
  //btcb added to balanced collateral
  cx5b5a03cb525a1845d0af3a872d525b18a810acb0: new Date(2022, 8, 21).getTime(),
  //eth added to balanced collateral
  cx288d13e1b63563459a2ac6179f237711f6851cb5: new Date(2022, 11, 8).getTime(),
  cx2609b924e33ef00b648a409245c7ea394c467824: new Date(2021, 3, 26).getTime(),
};

export const DATE_DEFAULT = new Date(2021, 3, 26).getTime();

export const DATE_STABILITY_FUND_LAUNCH = new Date(2022, 4, 13).getTime();

export const DEFAULT_GRANULARITY: Granularity = 'biweekly';

export const DEFAULT_GRANULARITY_FORMATTED: { [key in Granularity]: string } = {
  daily: 'day',
  weekly: '7 days',
  biweekly: '14 days',
  monthly: '30 days',
};
