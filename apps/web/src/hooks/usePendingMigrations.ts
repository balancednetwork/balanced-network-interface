import { useQuery, UseQueryResult, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sodax } from '@/lib/sodax';
import { DetailedLock } from '@sodax/sdk';
import { EvmXService, useXAccount, useXService, XChainId } from '@balancednetwork/xwagmi';
import { getWagmiChainId } from '@/hooks/useWalletProviderOptions';

const toBigInt = (value: bigint | number | string | undefined): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  return 0n;
};

const isClearedMigrationLock = (migration: DetailedLock): boolean => {
  return (
    toBigInt(migration.balnAmount) === 0n &&
    toBigInt(migration.sodaAmount) === 0n &&
    toBigInt(migration.unlockTime) === 0n &&
    toBigInt(migration.stakedSodaAmount) === 0n &&
    toBigInt(migration.xSodaAmount) === 0n &&
    toBigInt(migration.unstakeRequest.amount) === 0n
  );
};

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

      return (migrations || []).filter(migration => !isClearedMigrationLock(migration));
    },
    [publicClient],
  );

  const address = userAddress || evmAccount?.address;
  const isSignedIn = !!evmAccount?.address;

  return useQuery({
    queryKey: ['pendingMigrations', address, isSignedIn],
    queryFn: () => {
      // If not signed in or no address, return empty array
      if (!isSignedIn || !address) {
        return Promise.resolve([]);
      }
      return fetchPendingMigrations(address);
    },
    enabled: !!address && !!publicClient && isSignedIn,
    refetchInterval: 2000, // Refetch every 2 seconds
    placeholderData: isSignedIn ? keepPreviousData : undefined,
    staleTime: 1000, // Consider data stale after 1 second
  });
}
