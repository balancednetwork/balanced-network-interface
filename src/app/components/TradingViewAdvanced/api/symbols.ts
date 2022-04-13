import { LibrarySymbolInfo, ResolutionString } from 'charting_library/charting_library';

import { getTradePair } from 'constants/currency';
import { PairInfo } from 'constants/pairs';

import { defaultConfig } from '.';

export interface BalancedLibrarySymbolInfo extends LibrarySymbolInfo {
  pairID: number;
  isPairInverted: boolean;
  decimal: number;
}

const getPairIDAndInversion = (pairName: string): [PairInfo | undefined, boolean | undefined] => {
  const splitName = pairName.replaceAll(' ', '').split('/');
  return getTradePair(splitName[0], splitName[1]);
};

export const getSymbolInfo = (name: string): BalancedLibrarySymbolInfo => {
  const pairInfo = getPairIDAndInversion(name);
  const pair = pairInfo[0];
  let decimal = 18;
  let pairID = -1;

  if (pair) {
    const quoteToken = pair.quoteToken;
    const baseToken = pair.baseToken;
    decimal = (quoteToken?.decimals ?? 0) - (baseToken?.decimals ?? 0) + 18;
    pairID = pair.id;
  }
  const isPairInverted = !!pairInfo[1];

  return {
    pairID: pairID ? pairID : -1,
    isPairInverted,
    decimal,
    name,
    full_name: name,
    ticker: name,
    description: '',
    type: 'crypto',
    session: '24x7',
    exchange: '',
    listed_exchange: '',
    timezone: 'America/New_York',
    format: 'price',
    has_intraday: true,
    intraday_multipliers: ['5', '15', '60', '240'],
    has_weekly_and_monthly: true,
    pricescale: 1000,
    minmov: 1,
    supported_resolutions: defaultConfig['supported_resolutions'] || ['60' as ResolutionString],
    volume_precision: 2,
    data_status: 'streaming',
  };
};
