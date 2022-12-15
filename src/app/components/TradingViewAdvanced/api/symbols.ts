import { Token } from '@balancednetwork/sdk-core';
import { LibrarySymbolInfo, ResolutionString, SearchSymbolResultItem } from 'charting_library/charting_library';

import bnJs from 'bnJs';
import { SUPPORTED_PAIRS } from 'constants/pairs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

import { defaultConfig } from '.';

export interface BalancedLibrarySymbolInfo extends LibrarySymbolInfo {
  pairID: number;
  isPairInverted: boolean;
  decimal: number;
}

const SUPPORTED_PAIRS_WITHOUT_QUEUE = SUPPORTED_PAIRS.filter(pair => pair.name !== 'sICX/ICX');

const getPairTokens = (pairName: string): { base: Token; quote: Token } | undefined => {
  const name = pairName.replaceAll(' ', '').split('/');
  const base = SUPPORTED_TOKENS_LIST.find(token => token.symbol === name[0]);
  const quote = SUPPORTED_TOKENS_LIST.find(token => token.symbol === name[1]);

  if (base && quote) {
    return {
      base,
      quote,
    };
  }
};

export const getSymbolInfo = async (name: string): Promise<BalancedLibrarySymbolInfo> => {
  const pairTokens = getPairTokens(name);
  const poolData =
    pairTokens && (await bnJs.Dex.getPoolStatsForPair(pairTokens.base.address, pairTokens.quote.address));
  const inverse = poolData.base_token !== pairTokens?.base.address;
  let decimal = 18;
  let pairID = -1;

  if (poolData && pairTokens) {
    decimal = (pairTokens.quote.decimals ?? 0) - (pairTokens.base.decimals ?? 0) + 18;
    pairID = parseInt(poolData.id);
  }

  return {
    pairID: pairID ? pairID : -1,
    isPairInverted: inverse,
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
