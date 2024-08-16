import axios from 'axios';
import BigNumber from 'bignumber.js';
import bnJs from '@/bnJs';
import { getTimestampFrom } from '@/pages/PerformanceDetails/utils';
import { API_ENDPOINT, BlockDetails, useBlockDetails } from '@/queries/blockDetails';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';

const BURNER_CX_CREATED = 1708324683000;

type BurnChartItem = { timestamp: number; value: number; pending: number; week: number };

function generateWeeklyTimestamps(startTimestamp: number): [number, number][] {
  const start = new Date(startTimestamp);
  const now = new Date();

  const timestamps: [number, number][] = [];

  while (start < now) {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    if (end > now) {
      end.setTime(now.getTime()); // If the end of the week is in the future, set it to now
    }

    timestamps.push([start.getTime(), end.getTime()]);

    start.setDate(start.getDate() + 7); // Move to the next week
  }

  return timestamps;
}

function useBurnChartData(): UseQueryResult<BurnChartItem[] | undefined> {
  return useQuery({
    queryKey: ['burnChartData'],
    queryFn: async () => {
      const weeklyTimestamps = generateWeeklyTimestamps(BURNER_CX_CREATED);

      return await Promise.all(
        weeklyTimestamps.map(async ([start, end], index, arr) => {
          const isLast = index === arr.length - 1;

          const { data: startBlock } = await axios.get<BlockDetails>(`${API_ENDPOINT}blocks/timestamp/${start * 1000}`);
          const { data: endBlock } = await axios.get<BlockDetails>(`${API_ENDPOINT}blocks/timestamp/${end * 1000}`);

          const startBurnRaw = await bnJs.ICXBurner.getBurnedAmount(startBlock.number);
          const endBurnRaw = await bnJs.ICXBurner.getBurnedAmount(endBlock.number);

          const burned = new BigNumber(endBurnRaw)
            .minus(startBurnRaw)
            .div(10 ** 18)
            .toNumber();

          let pending = 0;
          if (isLast) {
            const pendingBurnRaw = await bnJs.ICXBurner.getPendingBurn();
            const unstakingBurnRaw = await bnJs.ICXBurner.getUnstakingBurn();

            pending = new BigNumber(pendingBurnRaw)
              .plus(unstakingBurnRaw)
              .div(10 ** 18)
              .toNumber();
          }

          return {
            timestamp: start,
            value: burned,
            pending,
            week: index + 1,
          };
        }),
      );
    },

    enabled: true,
  });
}

export function useBurnData(): UseQueryResult<{
  chartData: BurnChartItem[];
  awaitingBurn: BigNumber;
  pastMonthBurn: BigNumber;
  totalBurn: BigNumber;
}> {
  const { data: chartData } = useBurnChartData();
  const { data: blockDetails } = useBlockDetails(getTimestampFrom(30));
  const blockHeight = blockDetails?.number;

  return useQuery({
    queryKey: [`burnData`, chartData ? chartData.length : 0],
    queryFn: async () => {
      if (!blockHeight) return;

      const totalRaw = await bnJs.ICXBurner.getBurnedAmount();
      const totalPastRaw = await bnJs.ICXBurner.getBurnedAmount(blockHeight);
      const pendingBurnRaw = await bnJs.ICXBurner.getPendingBurn();
      const unstakingBurnRaw = await bnJs.ICXBurner.getUnstakingBurn();

      const totalBurn = new BigNumber(totalRaw).div(10 ** 18);
      const pastMonthBurn = totalBurn.minus(new BigNumber(totalPastRaw || 0).div(10 ** 18));

      const pendingBurn = new BigNumber(pendingBurnRaw).div(10 ** 18);
      const unstakingBurn = new BigNumber(unstakingBurnRaw).div(10 ** 18);

      return {
        chartData,
        totalBurn,
        pastMonthBurn,
        awaitingBurn: pendingBurn.plus(unstakingBurn),
      };
    },
    enabled: !!blockHeight,
    placeholderData: keepPreviousData,
  });
}
