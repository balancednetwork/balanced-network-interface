import { useQuery, UseQueryResult, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { sodax } from '@/lib/sodax';
import { DetailedLock, getHubChainConfig } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { EvmXService, useXAccount, useXService, XChainId } from '@balancednetwork/xwagmi';
import { getWagmiChainId } from '@/hooks/useWalletProviderOptions';

export const PENDING_MIGRATIONS_QUERY_KEY = 'pendingMigrations';
const BALN_SWAP_ADDRESS = getHubChainConfig(SONIC_MAINNET_CHAIN_ID).addresses.balnSwap;

const legacySwapEvent = {
  type: 'event',
  name: 'Swap',
  inputs: [
    { name: 'user', type: 'address', indexed: true },
    { name: 'balnAmount', type: 'uint256', indexed: false },
    { name: 'sodaAmount', type: 'uint256', indexed: false },
    { name: 'lockupPeriod', type: 'uint256', indexed: false },
  ],
} as const;

const swapEvent = {
  type: 'event',
  name: 'Swap',
  inputs: [
    { name: 'user', type: 'address', indexed: true },
    { name: 'balnAmount', type: 'uint256', indexed: false },
    { name: 'sodaAmount', type: 'uint256', indexed: false },
  ],
} as const;

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

export function useInitialMigrationSodaAmounts(
  lockCount: number,
  userAddress?: string,
): UseQueryResult<readonly bigint[], Error> {
  const evmAccount = useXAccount('EVM');
  // Use the SDK's hub client for historical logs. The wallet service uses the
  // free dRPC endpoint, which rejects eth_getLogs ranges over 10,000 blocks.
  const publicClient = sodax.hubProvider.publicClient;
  const address = userAddress || evmAccount?.address;
  const isSignedIn = !!evmAccount?.address;

  return useQuery({
    queryKey: [PENDING_MIGRATIONS_QUERY_KEY, 'initialSodaAmounts', address, lockCount],
    queryFn: async (): Promise<readonly bigint[]> => {
      if (!address) return [];

      const [legacyLogs, currentLogs] = await Promise.all([
        (publicClient as any).getLogs({
          address: BALN_SWAP_ADDRESS,
          event: legacySwapEvent,
          args: { user: address as `0x${string}` },
          fromBlock: 0n,
          toBlock: 'latest',
        }),
        (publicClient as any).getLogs({
          address: BALN_SWAP_ADDRESS,
          event: swapEvent,
          args: { user: address as `0x${string}` },
          fromBlock: 0n,
          toBlock: 'latest',
        }),
      ]);

      // No-lockup swaps are transferred immediately and never receive a lock
      // index, so exclude them before aligning event order with the lock array.
      const lockedLegacyLogs = legacyLogs.filter(log => log.args.lockupPeriod > 0n);

      return [...lockedLegacyLogs, ...currentLogs]
        .sort((a, b) => {
          const blockA = a.blockNumber ?? 0n;
          const blockB = b.blockNumber ?? 0n;
          if (blockA !== blockB) return blockA < blockB ? -1 : 1;
          return (a.logIndex ?? 0) - (b.logIndex ?? 0);
        })
        .map(log => log.args.sodaAmount);
    },
    enabled: !!address && isSignedIn && lockCount > 0,
    staleTime: Infinity,
  });
}
