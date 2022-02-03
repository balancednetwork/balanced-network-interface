import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';
import { useAllTransactions } from 'store/transactions/hooks';

export const useBnJsContractQuery = <T>(contract: string, method: string, args: any[], fetchPerTx: boolean = true) => {
  const transactions = useAllTransactions();
  return useQuery<T, string>(
    QUERY_KEYS.BnJs(contract, method, args, fetchPerTx ? transactions : undefined),
    async () => {
      return bnJs[contract][method](...args);
    },
    { keepPreviousData: true },
  );
};
