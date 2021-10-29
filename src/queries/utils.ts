import { BalancedJs } from 'packages/BalancedJs';
import { useQuery } from 'react-query';

import QUERY_KEYS from 'queries/queryKeys';

export const useBnJsContractQuery = <T>(bnJs: BalancedJs, contract: string, method: string, args: any[]) => {
  return useQuery<T, string>(QUERY_KEYS.BnJs(contract, method, args), async () => {
    return bnJs[contract][method](...args);
  });
};
