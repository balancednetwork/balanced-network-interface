import { useQuery } from '@tanstack/react-query';
import { XTransactionInput } from '../xcall/types';
import { useXPublicClient } from './useXPublicClient';

export function useXEstimateSwapGas(xTransactionInput: XTransactionInput | undefined): bigint | undefined {
  const xPublicClient = useXPublicClient(xTransactionInput?.direction.from);

  const { data } = useQuery({
    queryKey: ['estimateSwapGas', xTransactionInput],
    queryFn: async () => {
      if (!xPublicClient) return;
      if (!xTransactionInput) return;

      return await xPublicClient.estimateSwapGas(xTransactionInput);
    },
    enabled: Boolean(xTransactionInput && xPublicClient),
  });

  return data;
}
