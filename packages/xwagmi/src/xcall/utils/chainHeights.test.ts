import assert from 'node:assert/strict';
import test from 'node:test';
import { readChainHeights } from './chainHeights';

test('retains successful chain heights when another RPC fails', async () => {
  const heights = await readChainHeights(['icon', 'bsc', 'failed', 'unused'], chain => ({
    getBlockHeight: async () => {
      if (chain === 'failed') throw new Error('unavailable');
      return chain === 'icon' ? 100n : chain === 'bsc' ? 200n : 0n;
    },
  }));
  assert.deepEqual(heights, { icon: 100n, bsc: 200n });
});

test('handles clients that have not initialized yet', async () => {
  assert.deepEqual(await readChainHeights(['not-ready'], () => undefined), {});
});

test('a hanging RPC cannot prevent other heights from being published', async () => {
  const heights = await readChainHeights(
    ['ready', 'hung'],
    chain => ({
      getBlockHeight: () => (chain === 'ready' ? Promise.resolve(300n) : new Promise(() => {})),
    }),
    10,
  );
  assert.deepEqual(heights, { ready: 300n });
});
