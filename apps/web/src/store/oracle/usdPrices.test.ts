import assert from 'node:assert/strict';
import test from 'node:test';
import { parseUsdPrices } from './usdPrices';

test('reads USD prices without an ICX conversion and skips failed prices', () => {
  const prices = parseUsdPrices(['BTC', 'ICX', 'ETH'], ['0x3635c9adc5dea00000', null, '0x1bc16d674ec80000']);
  assert.equal(prices.BTC.toFixed(), '1000');
  assert.equal(prices.ETH.toFixed(), '2');
  assert.equal(prices.ICX, undefined);
});

test('omits zero, negative, and invalid prices instead of exposing NaN or Infinity', () => {
  assert.deepEqual(parseUsdPrices(['A', 'B', 'C', 'D', 'E'], ['0x0', '-1', 'bad', '', 'Infinity']), {});
});

test('keeps requested symbols distinct even when they share an oracle feed', () => {
  const prices = parseUsdPrices(['BTC', 'BTCB', 'cbBTC'], ['0xde0b6b3a7640000', '0xde0b6b3a7640000', null]);
  assert.equal(prices.BTC.toFixed(), '1');
  assert.equal(prices.BTCB.toFixed(), '1');
  assert.equal(prices.cbBTC, undefined);
});
