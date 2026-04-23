import { useQuery, UseQueryResult, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sodax } from '@/lib/sodax';
import { DetailedLock } from '@sodax/sdk';
import { EvmXService, useXAccount, useXService, XChainId } from '@balancednetwork/xwagmi';
import { getWagmiChainId } from '@/hooks/useWalletProviderOptions';

export const PENDING_MIGRATIONS_QUERY_KEY = 'pendingMigrations';

export const toBigInt = (value: bigint | number | string | undefined): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  return 0n;
};

// A migration lock that has been fully drained (e.g. after claiming) is returned
// by the contract with all fields zeroed. These should not be displayed, but we
// must NOT drop them from the array — the SDK addresses locks by their array
// index, so removing items would shift every subsequent lock's id.
export const isClearedMigrationLock = (migration: DetailedLock): boolean => {
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

      return migrations || [];
    },
    [publicClient],
  );

  const address = userAddress || evmAccount?.address;
  const isSignedIn = !!evmAccount?.address;

  return useQuery({
    queryKey: [PENDING_MIGRATIONS_QUERY_KEY, address, isSignedIn],
    queryFn: () => {
      if (!isSignedIn || !address) {
        return Promise.resolve([]);
      }
      return fetchPendingMigrations(address);
    },
    enabled: !!address && !!publicClient && isSignedIn,
    refetchInterval: 3000,
    placeholderData: isSignedIn ? keepPreviousData : undefined,
    staleTime: 1000,
  });
}
