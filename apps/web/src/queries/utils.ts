import { keepPreviousData, useQuery } from '@tanstack/react-query';

import QUERY_KEYS from '@/queries/queryKeys';
import { useAllTransactions } from '@/store/transactions/hooks';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

export const useBnJsContractQuery = <T>(contract: string, method: string, args: any[], fetchPerTx: boolean = true) => {
  const transactions = useAllTransactions();
  return useQuery<T, string>({
    queryKey: QUERY_KEYS.BnJs(contract, method, args, fetchPerTx ? transactions : undefined),
    queryFn: async () => {
      return bnJs[contract][method](...args);
    },
    placeholderData: keepPreviousData,
  });
};
