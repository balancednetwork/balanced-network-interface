import axios from 'axios';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { ONE_DAY_DURATION } from 'utils';

export type xCallActivityDataType = {
  hour: string;
  count: number;
};

export function useXCallStats(): UseQueryResult<{ transactionCount: number; data: xCallActivityDataType[] }> {
  const yesterdayTimestamp = new Date().getTime() - ONE_DAY_DURATION;
  async function getTxs(skip: number, limit: number) {
    const apiUrl = `https://xcallscan.xyz/api/messages?skip=${skip}&limit=${limit}`;
    const response = await axios.get(apiUrl);
    return response.data.data;
  }

  function countTransactionsByHour(transactions: { created_at: number }[]): xCallActivityDataType[] {
    const transactionCountByHour: { count: number; hour: string }[] = [];

    const yesterdayDate = new Date(yesterdayTimestamp);
    const currentHour = yesterdayDate.getHours();

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i + 1) % 24;
      transactionCountByHour.push({
        count: 1,
        hour: hour.toString().padStart(2, '0'),
      });
    }

    return transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.created_at * 1000);
      const hour = date.getHours().toString().padStart(2, '0');

      const currentHour = acc.find(item => item.hour === hour);
      if (currentHour) currentHour.count = currentHour.count + 1;
      return acc;
    }, transactionCountByHour);
  }

  return useQuery({
    queryKey: ['xCallStats'],
    queryFn: async () => {
      const txBatches: any[] = [];

      for (let i = 0; i < 10; i++) {
        const txs: any[] = await getTxs(i * 100, 100);
        const last24hoursIndex = txs.findIndex(tx => tx.created_at * 1000 < yesterdayTimestamp);
        if (last24hoursIndex >= 0) {
          txs.splice(last24hoursIndex);
          txBatches.push(...txs);
          break;
        }

        txBatches.push(...txs);
      }

      const filtered = txBatches.filter(tx => tx.status === 'executed');

      const transactionsByHour = countTransactionsByHour(filtered);
      return {
        transactionCount: filtered.length,
        data: transactionsByHour,
      };
    },

    placeholderData: keepPreviousData,
    refetchInterval: 100000,
  });
}
