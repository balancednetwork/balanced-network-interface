import { useQuery, UseQueryResult, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sodax } from '@/lib/sodax';
import { DetailedLock } from '@sodax/sdk';
import { EvmXService, useXAccount, useXService, XChainId } from '@balancednetwork/xwagmi';
import { getWagmiChainId } from '@/hooks/useWalletProviderOptions';

export function usePendingMigrations(userAddress?: string): UseQueryResult<readonly DetailedLock[], Error> {
  const evmAccount = useXAccount('EVM');
  const evmXService = useXService('EVM') as EvmXService | undefined;
  const wagmiChainId = getWagmiChainId('sonic' as XChainId);
  const publicClient = evmXService?.getPublicClient(wagmiChainId);

  const fetchPendingMigrations = useCallback(
    async (address: string): Promise<readonly DetailedLock[]> => {
      if (!publicClient) {
        throw new Error('Public client not found');
      }

      const migrations = await sodax.migration.balnSwapService.getDetailedUserLocks(
        publicClient as any,
        address as `0x${string}`,
      );

      return migrations || [];
    },
    [publicClient],
  );

  const address = userAddress || evmAccount?.address;

  return useQuery({
    queryKey: ['pendingMigrations', address],
    queryFn: () => fetchPendingMigrations(address!),
    enabled: !!address && !!publicClient,
    refetchInterval: 2000, // Refetch every 2 seconds
    placeholderData: keepPreviousData,
    staleTime: 1000, // Consider data stale after 1 second
  });
}
