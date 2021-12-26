import { BalancedJs } from 'packages/BalancedJs';
import { useQuery } from 'react-query';

import QUERY_KEYS from 'queries/queryKeys';
import { useAllTransactions } from 'store/transactions/hooks';

export const useBnJsContractQuery = <T>(bnJs: BalancedJs, contract: string, method: string, args: any[]) => {
  const transactions = useAllTransactions();
  return useQuery<T, string>(QUERY_KEYS.BnJs(contract, method, args, transactions), async () => {
    return bnJs[contract][method](...args);
  });
};
