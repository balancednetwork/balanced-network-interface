export async function readChainHeights<T extends string>(
  chainIds: T[],
  getClient: (chainId: T) => { getBlockHeight(): Promise<bigint> } | undefined,
  timeoutMs = 10_000,
): Promise<Partial<Record<T, bigint>>> {
  const heights: Partial<Record<T, bigint>> = {};
  await Promise.allSettled(
    chainIds.map(async chainId => {
      const client = getClient(chainId);
      if (!client) return;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const height = await Promise.race([
          client.getBlockHeight(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error('Block-height request timed out')), timeoutMs);
          }),
        ]);
        if (height > 0n) heights[chainId] = height;
      } finally {
        clearTimeout(timeout);
      }
    }),
  );
  return heights;
}
