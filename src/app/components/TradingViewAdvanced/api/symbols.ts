import { Token } from '@balancednetwork/sdk-core';
import { LibrarySymbolInfo, ResolutionString, SearchSymbolResultItem } from 'charting_library/charting_library';

import { PairInfo, SUPPORTED_PAIRS } from 'constants/pairs';

import { defaultConfig } from '.';

export interface BalancedLibrarySymbolInfo extends LibrarySymbolInfo {
  pairID: number;
  isPairInverted: boolean;
  decimal: number;
}

const SUPPORTED_PAIRS_WITHOUT_QUEUE = SUPPORTED_PAIRS.filter(pair => pair.name !== 'sICX/ICX');

const getPairIDAndInversion = (pairName: string): { info: PairInfo | undefined; inversion: boolean | undefined } => {
  const name = pairName.replaceAll(' ', '');
  const reversedName = name.split('/').reverse().join('/');
  const pairInfo = SUPPORTED_PAIRS.find(pair => pair.name === name);
  const pairInfoFromInversion = SUPPORTED_PAIRS.find(pair => pair.name === reversedName);

  return {
    info: pairInfo || pairInfoFromInversion,
    inversion: pairInfoFromInversion !== undefined,
  };
};

export const getSymbolInfo = (name: string): BalancedLibrarySymbolInfo => {
  const pairInfo = getPairIDAndInversion(name);
  const pair = pairInfo.info;
  let decimal = 18;
  let pairID = -1;

  if (pair) {
    const quoteToken = pair.quoteToken;
    const baseToken = pair.baseToken;
    decimal = (quoteToken?.decimals ?? 0) - (baseToken?.decimals ?? 0) + 18;
    pairID = pair.id;
  }

  return {
    pairID: pairID ? pairID : -1,
    isPairInverted: !!pairInfo.inversion,
    decimal,
    name,
    full_name: name,
    ticker: name,
    description: '',
    type: 'crypto',
    session: '24x7',
    exchange: 'Balanced',
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

export const getFilteredSupportedPairNames = (query: string = ''): SearchSymbolResultItem[] => {
  const isQueried = (query: string, token: Token): boolean => {
    return (
      token.name!.toLowerCase().indexOf(query.toLowerCase()) >= 0 ||
      token.symbol!.toLowerCase().indexOf(query.toLowerCase()) >= 0 ||
      token.searchableTerms.toLowerCase().indexOf(query.toLowerCase()) >= 0
    );
  };

  return SUPPORTED_PAIRS_WITHOUT_QUEUE.filter(pair => {
    return (
      isQueried(query, pair.baseToken) ||
      isQueried(query, pair.quoteToken) ||
      pair.name.toLowerCase().replace('/', '').indexOf(query.toLowerCase()) >= 0
    );
  })
    .map(pair => {
      return {
        symbol: pair.name.replace('/', ''),
        full_name: pair.name,
        description: `${pair.baseToken.name!} / ${pair.quoteToken.name!}`,
        type: '',
        exchange: '',
        ticker: pair.name,
      };
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
};
