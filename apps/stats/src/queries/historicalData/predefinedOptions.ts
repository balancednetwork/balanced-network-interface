import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';
import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import { formatUnits } from '@/utils';

import { DATES, DATE_DEFAULT, DEFAULT_GRANULARITY } from './dates';
import { Granularity, HistoryForParams } from './types';

export function getBnUSDMintedWithBitcoinParams(granularity: Granularity, startTime?: number): HistoryForParams {
  return {
    contract: 'Loans',
    method: 'getTotalCollateralDebt',
    methodParams: [
      { isNumber: false, value: 'BTCB' },
      { isNumber: false, value: 'bnUSD' },
    ],
    granularity: granularity,
    startTime: startTime || DATES['BTCB'],
    transformation: item => new BigNumber(formatUnits(item, 18, 2)).toNumber(),
  };
}

export function getCollateralParams(
  collateralType: string,
  granularity: Granularity = DEFAULT_GRANULARITY,
  startTime?: number,
): HistoryForParams | undefined {
  switch (collateralType) {
    case predefinedCollateralTypes.ALL:
      return;
    case predefinedCollateralTypes.STABILITY_FUND:
      return;
    default:
      return {
        contract: collateralType === 'sICX' ? 'sICX' : undefined,
        contractAddress: collateralType,
        method: 'balanceOf',
        methodParams: [{ isNumber: false, value: bnJs.Loans.address }],
        granularity: granularity,
        startTime: startTime || DATES[collateralType] || DATE_DEFAULT,
        transformation: item => new BigNumber(formatUnits(item, 18, 18)).toNumber(),
      };
  }
}

export function getMintedAgainstParams(
  collateralType: string,
  collateralAddress: string,
  granularity: Granularity = DEFAULT_GRANULARITY,
  startTime?: number,
): HistoryForParams | undefined {
  switch (collateralType) {
    case predefinedCollateralTypes.ALL:
      return;
    case predefinedCollateralTypes.STABILITY_FUND:
      return;
    default:
      return {
        contract: 'Loans',
        method: 'getTotalCollateralDebt',
        methodParams: [
          { isNumber: false, value: collateralType },
          { isNumber: false, value: 'bnUSD' },
        ],
        granularity: granularity,
        startTime: startTime || DATES[collateralAddress] || DATE_DEFAULT,
        transformation: item => new BigNumber(formatUnits(item, 18, 18)).toNumber(),
      };
  }
}
