import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LegacyPositions,
  isCollateralKnown,
  normalizePositionHoldings,
  readLegacyPositions,
  summarizePositionReads,
} from './legacyPositions';

const owner = '0x38.bsc/0x6A9a3F8120714e1E4053bbE42fa68219d306fa9c';
const tokens = { BTC: 'cx-btc', ETH: 'cx-eth' };
const failure = new Error('SCOREError(-30001): E0001:UnknownFailure');
const holdings = { BTC: { BTC: '0xfd529c37108000', bnUSD: '0x8cdc0f5f3c16c36f9e' } };

test('returns normal holdings without consulting borrower lists', async () => {
  const result = await readLegacyPositions(
    async method => {
      assert.equal(method, 'getAccountPositions');
      return { holdings };
    },
    owner,
    tokens,
  );
  assert.deepEqual(result, { holdings, source: 'positions' });
});

test('a confirmed missing position returns zero holdings', async () => {
  const result = await readLegacyPositions(
    async method => {
      assert.equal(method, 'getAccountPositions');
      throw new Error(`${owner} does not have a position in Balanced`);
    },
    owner,
    tokens,
  );
  assert.deepEqual(result.holdings, { BTC: { BTC: '0x0', bnUSD: '0x0' }, ETH: { ETH: '0x0', bnUSD: '0x0' } });
  assert.equal(result.source, 'positions');
});

test('recovers the reported account through paginated unpriced borrower reads', async () => {
  const result = await readLegacyPositions(
    async (method, params) => {
      if (method === 'getAccountPositions') throw failure;
      if (method === 'getBalanceAndSupply') return { _balance: '0x8cdc0f5f3c16c36f9e' };
      if (method === 'getBorrowerCount') return params?.collateralAddress === 'cx-btc' ? '0x33' : '0x0';
      if (method === 'getBorrowers') {
        if (params?.startId === '0x0') {
          return Array.from({ length: 50 }, (_, i) => ({
            id: `0x${(i + 1).toString(16)}`,
            nextId: `0x${(i + 2).toString(16)}`,
            address: `other-${i}`,
            BTC: '0x1',
            debt: '0x1',
          }));
        }
        assert.equal(params?.startId, '0x33');
        return [{ id: '0x33', nextId: '0x1', address: owner, BTC: '0xfd529c37108000', debt: '0x8cdc0f5f3c16c36f9e' }];
      }
      throw new Error(`Unexpected method ${method}`);
    },
    owner,
    tokens,
  );
  assert.deepEqual(result, { holdings, source: 'borrowers' });
});

test('does not turn network failures into zero holdings', async () => {
  await assert.rejects(
    readLegacyPositions(
      async () => {
        throw new Error('Network Error');
      },
      owner,
      tokens,
    ),
    /Network Error/,
  );
});

test('does not claim absence for collateral-only positions', async () => {
  await assert.rejects(
    readLegacyPositions(
      async method => {
        if (method === 'getAccountPositions') throw failure;
        if (method === 'getBalanceAndSupply') return { _balance: '0x0' };
        throw new Error('Unexpected borrower lookup');
      },
      owner,
      tokens,
    ),
    /collateral-only/i,
  );
});

test('rejects incomplete recovery rather than displaying a partial debt as the whole loan', async () => {
  await assert.rejects(
    readLegacyPositions(
      async method => {
        if (method === 'getAccountPositions') throw failure;
        if (method === 'getBalanceAndSupply') return { _balance: '0x10' };
        if (method === 'getBorrowerCount') return '0x1';
        return [{ id: '0x1', nextId: '0x1', address: owner, BTC: '0x1', ETH: '0x1', debt: '0x1' }];
      },
      owner,
      tokens,
    ),
    /complete/i,
  );
});

test('preserves case-sensitive on-chain owner keys', async () => {
  await assert.rejects(
    readLegacyPositions(
      async method => {
        if (method === 'getAccountPositions') throw failure;
        if (method === 'getBalanceAndSupply') return { _balance: '0x1' };
        if (method === 'getBorrowerCount') return '0x1';
        return [{ id: '0x1', nextId: '0x1', address: owner.toLowerCase(), BTC: '0x1', ETH: '0x1', debt: '0x1' }];
      },
      owner,
      tokens,
    ),
    /complete/i,
  );
});

test('an unavailable chain does not discard a healthy recovered position', () => {
  const healthy: LegacyPositions = { holdings, source: 'borrowers' };
  const result = summarizePositionReads(
    [
      { data: healthy, isError: false, isPending: false },
      { data: { holdings: {}, source: 'positions' as const }, isError: true, isPending: false },
      { isError: false, isPending: true },
    ],
    ['0x38.bsc', '0x1.icon', '0xa4b1.arbitrum'],
  );
  assert.deepEqual(result.data, [healthy]);
  assert.deepEqual(result.unavailableChains, ['0x1.icon']);
  assert.deepEqual(result.pendingChains, ['0xa4b1.arbitrum']);
});

test('normalizes collateral and debt together at the query boundary', () => {
  assert.deepEqual(normalizePositionHoldings(holdings, { BTC: 18 }), {
    BTC: { collateral: '0.071304', loan: '2598.401167844016615326' },
  });
});

test('rejects missing decimals or malformed holdings instead of retaining old collateral', () => {
  assert.throws(() => normalizePositionHoldings(holdings, {}), /decimals/i);
  assert.throws(() => normalizePositionHoldings({ BTC: { BTC: 'garbage', bnUSD: '0x1' } }, { BTC: 18 }), /balance/i);
});

test('fallback missing collateral remains unknown rather than being displayed as zero', () => {
  assert.equal(isCollateralKnown({ holdings, source: 'borrowers' }, 'BTC'), true);
  assert.equal(isCollateralKnown({ holdings, source: 'borrowers' }, 'ETH'), false);
  assert.equal(isCollateralKnown(undefined, 'BTC'), true);
});
