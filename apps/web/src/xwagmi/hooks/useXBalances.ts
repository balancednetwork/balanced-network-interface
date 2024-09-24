import { Currency, CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useXPublicClient } from './useXPublicClient';

export function useXBalances({
  xChainId,
  xTokens,
  address,
}: { xChainId: XChainId; xTokens: XToken[]; address: string | undefined }): UseQueryResult<{
  [key: string]: CurrencyAmount<Currency>;
}> {
  const xPublicClient = useXPublicClient(xChainId);
  return useQuery({
    queryKey: [`xBalances`, xChainId, xTokens, address],
    queryFn: async () => {
      if (!xPublicClient) {
        return {};
      }

      const balances = await xPublicClient.getBalances(address, xTokens);
      return balances;
    },
    enabled: !!xPublicClient,
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}
