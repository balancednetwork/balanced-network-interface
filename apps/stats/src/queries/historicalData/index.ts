import { useTokenPrices } from '@/queries/backendv2';
import { BlockDetails } from '@/queries/blockDetails';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';
import { formatUnits } from '@/utils';

import { DATES, DATE_DEFAULT, DATE_STABILITY_FUND_LAUNCH, DEFAULT_GRANULARITY } from './dates';
import { Granularity, HistoryForParams } from './types';
import { GRANULARITY_MILLISECONDS } from './utils';

export const API_ICON_ENDPOINT = 'https://tracker.icon.community/api/v1/';

const getBlock = async (timestamp): Promise<BlockDetails> => {
  const { data } = await axios.get(`${API_ICON_ENDPOINT}blocks/timestamp/${timestamp * 1000}`);
  return data;
};

export default function useHistoryFor(params: HistoryForParams | undefined): UseQueryResult<any[], Error> {
  const {
    contract,
    contractAddress,
    method,
    methodParams = [],
    granularity,
    uniqueID,
    startTime,
    endTime,
    transformation,
  } = params || {};

  return useQuery({
    queryKey: [`useHistoryFor`, contract, contractAddress, method, uniqueID, granularity, startTime, endTime],
    queryFn: async () => {
      if (startTime && granularity && method && transformation) {
        const fiveMinPeriod = 1000 * 300;
        const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
        const endTimestamp = endTime || now;

        const timestamps: number[] = [];
        let currentTimestamp = endTimestamp;

        while (currentTimestamp > startTime) {
          timestamps.push(currentTimestamp);
          currentTimestamp -= GRANULARITY_MILLISECONDS[granularity];
        }

        if (startTime !== timestamps[timestamps.length - 1]) {
          timestamps.push(startTime);
        }

        const blockHeights = await Promise.all(timestamps.map(timestamp => getBlock(timestamp)));

        if (!contract && !contractAddress) {
          return;
        }

        try {
          const cx = contract ? bnJs[contract] : bnJs.getContract(contractAddress!);
          const dataSet = await Promise.all(
            blockHeights.map(async blockHeight => {
              const params = methodParams.map(param => (param.isNumber ? Number(param.value) : param.value));
              try {
                const data = await cx[method](...params, blockHeight.number);
                return {
                  //maybe add templating for the return object
                  timestamp: Math.floor(blockHeight.timestamp / 1000),
                  value: transformation(data),
                };
              } catch (e) {}
            }),
          );

          return dataSet.filter(item => item).reverse();
        } catch (e) {
          console.error('useHistory fetch error: ', e);
        }
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useHistoryForStabilityFund(
  granularity: Granularity = DEFAULT_GRANULARITY,
  startTime?: number,
  endTime?: number,
) {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;

  const startTimestamp = startTime || DATE_STABILITY_FUND_LAUNCH;
  const endTimestamp = endTime || now;

  const { data: historyForIUSDC, isSuccess: successIUSDC } = useHistoryFor({
    contractAddress: 'cxae3034235540b924dfcc1b45836c293dcc82bfb7',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.StabilityFund.address }],
    granularity: granularity,
    startTime: startTimestamp,
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 6, 2)).toNumber(),
  });

  const { data: historyForUSDS, isSuccess: successUSDS } = useHistoryFor({
    contractAddress: 'cxbb2871f468a3008f80b08fdde5b8b951583acf06',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.StabilityFund.address }],
    granularity: granularity,
    startTime: startTimestamp,
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 2)).toNumber(),
  });

  const { data: historyForBUSD, isSuccess: successBUSD } = useHistoryFor({
    contractAddress: 'cxb49d82c46be6b61cab62aaf9824b597c6cf8a25d',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.StabilityFund.address }],
    granularity: granularity,
    startTime: startTimestamp,
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 2)).toNumber(),
  });

  return useQuery({
    queryKey: [`historyForStabilityFund`, granularity, startTimestamp, endTimestamp],
    queryFn: () => {
      if (historyForIUSDC && historyForUSDS && historyForBUSD) {
        const filteredHistoryForIUSDC = historyForIUSDC.filter(
          (item, index) => item && historyForIUSDC[Math.min(index + 1, historyForIUSDC.length - 1)].value !== 0,
        );
        const filteredHistoryForUSDS = historyForUSDS.filter(
          (item, index) => item && historyForUSDS[Math.min(index + 1, historyForUSDS.length - 1)].value !== 0,
        );
        const filteredHistoryForBUSD = historyForBUSD.filter(
          (item, index) => item && historyForBUSD[Math.min(index + 1, historyForBUSD.length - 1)].value !== 0,
        );

        const IUSDCReversed = filteredHistoryForIUSDC.slice().reverse();
        const USDSReversed = filteredHistoryForUSDS.slice().reverse();
        const BUSDReversed = filteredHistoryForBUSD.slice().reverse();

        const total = IUSDCReversed.map((item, index) => {
          let currentTotal = item.value;

          if (USDSReversed[index] && USDSReversed[index].timestamp === item.timestamp) {
            currentTotal += USDSReversed[index].value;
          }

          if (BUSDReversed[index] && BUSDReversed[index].timestamp === item.timestamp) {
            currentTotal += BUSDReversed[index].value;
          }

          return {
            timestamp: item.timestamp,
            value: Math.floor(currentTotal),
          };
        });

        const stacked = IUSDCReversed.map((item, index) => {
          const combinedItem = {
            timestamp: item.timestamp,
            IUSDC: item.value,
          };

          if (USDSReversed[index] && USDSReversed[index].timestamp === item.timestamp) {
            combinedItem['USDS'] = USDSReversed[index].value;
          }

          if (BUSDReversed[index] && BUSDReversed[index].timestamp === item.timestamp) {
            combinedItem['BUSD'] = BUSDReversed[index].value;
          }

          return combinedItem;
        });

        return {
          IUSDC: filteredHistoryForIUSDC,
          USDS: filteredHistoryForUSDS,
          BUSD: filteredHistoryForBUSD,
          total: total.reverse(),
          stacked: stacked.reverse(),
        };
      }
    },
    enabled: successIUSDC && successBUSD && successUSDS,
    placeholderData: keepPreviousData,
  });
}

export function useHistoryForTotal(
  granularity: Granularity = DEFAULT_GRANULARITY,
  startTime?: number,
  endTime?: number,
) {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;
  const { data: tokenPrices, isSuccess: tokenPricesQuerySuccess } = useTokenPrices();

  const startTimestamp = startTime || DATE_DEFAULT;
  const endTimestamp = endTime || now;

  const { data: historyForStabilityFund, isSuccess: historyForStabilityFundSuccess } = useHistoryForStabilityFund(
    granularity,
    DATE_STABILITY_FUND_LAUNCH,
    endTimestamp,
  );
  const { data: historyForSICX, isSuccess: historyForSICXSuccess } = useHistoryFor({
    contractAddress: 'cx2609b924e33ef00b648a409245c7ea394c467824',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.Loans.address }],
    granularity: granularity,
    startTime: startTimestamp,
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 2)).toNumber(),
  });
  const { data: historyForBTCB, isSuccess: historyForBTCBSuccess } = useHistoryFor({
    contractAddress: 'cx5b5a03cb525a1845d0af3a872d525b18a810acb0',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.Loans.address }],
    granularity: granularity,
    startTime: DATES['cx5b5a03cb525a1845d0af3a872d525b18a810acb0'],
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 10)).toNumber(),
  });
  const { data: historyForETH, isSuccess: historyForETHSuccess } = useHistoryFor({
    contractAddress: 'cx288d13e1b63563459a2ac6179f237711f6851cb5',
    method: 'balanceOf',
    methodParams: [{ isNumber: false, value: bnJs.Loans.address }],
    granularity: granularity,
    startTime: DATES['cx288d13e1b63563459a2ac6179f237711f6851cb5'],
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 10)).toNumber(),
  });

  return useQuery({
    queryKey: [`historyForTotal`, granularity, startTimestamp, endTimestamp],
    queryFn: () => {
      if (historyForStabilityFund && historyForSICX && historyForETH && historyForBTCB && tokenPrices) {
        const sICXHistoryReversed = historyForSICX.slice().reverse();
        const ETHHistoryReversed = historyForETH.slice().reverse();
        const BTCBHistoryReversed = historyForBTCB.slice().reverse();
        const fundHistoryReversed = historyForStabilityFund.total.slice().reverse();

        const total = sICXHistoryReversed.map((item, index) => {
          let currentTotal = tokenPrices['sICX'].times(item.value);

          if (ETHHistoryReversed[index] && ETHHistoryReversed[index].timestamp === item.timestamp) {
            currentTotal = currentTotal.plus(tokenPrices['ETH'].times(ETHHistoryReversed[index].value));
          }

          if (BTCBHistoryReversed[index] && BTCBHistoryReversed[index].timestamp === item.timestamp) {
            currentTotal = currentTotal.plus(tokenPrices['BTCB'].times(BTCBHistoryReversed[index].value));
          }

          if (fundHistoryReversed[index] && fundHistoryReversed[index].timestamp === item.timestamp) {
            currentTotal = currentTotal.plus(fundHistoryReversed[index].value);
          }

          return {
            timestamp: item.timestamp,
            value: Math.floor(currentTotal.toNumber()),
          };
        });

        return total.reverse();
      }
    },
    enabled:
      historyForStabilityFundSuccess &&
      historyForSICXSuccess &&
      historyForBTCBSuccess &&
      historyForETHSuccess &&
      tokenPricesQuerySuccess,
    placeholderData: keepPreviousData,
  });
}

export function useHistoryForBnUSDTotalSupply(
  granularity: Granularity = DEFAULT_GRANULARITY,
  startTime?: number,
  endTime?: number,
) {
  const fiveMinPeriod = 1000 * 300;
  const now = Math.floor(new Date().getTime() / fiveMinPeriod) * fiveMinPeriod;

  const startTimestamp = startTime || DATE_DEFAULT;
  const endTimestamp = endTime || now;

  const { data: historyForBnUSDTotal, isSuccess: historyForBnUSDTotalSuccess } = useHistoryFor({
    contractAddress: bnJs.bnUSD.address,
    method: 'totalSupply',
    granularity: granularity,
    startTime: startTimestamp,
    endTime: endTimestamp,
    transformation: item => new BigNumber(formatUnits(item, 18, 10)).toNumber(),
  });

  return useQuery({
    queryKey: [`historyForBnUSDTotal`, granularity, startTimestamp, endTimestamp],
    queryFn: () => {
      return historyForBnUSDTotal;
    },
    enabled: historyForBnUSDTotalSuccess,
    placeholderData: keepPreviousData,
  });
}
