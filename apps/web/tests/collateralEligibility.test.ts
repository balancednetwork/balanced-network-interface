import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import BigNumber from 'bignumber.js';

import {
  getActionMaximum,
  isCollateralEnabled,
  isIncreaseAllowed,
  selectEnabledCollateralTokens,
} from '../src/store/collateral/eligibility.ts';

const tokens = { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' };

test('keeps registered tokens separate from debt-ceiling-enabled tokens', () => {
  const enabled = selectEnabledCollateralTokens(tokens, new Set<string>());

  assert.deepEqual(tokens, { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' });
  assert.deepEqual(enabled, {});
  assert.equal(isCollateralEnabled(enabled, 'sICX'), false);
});

test('disabled collateral can decrease but not increase its deposited amount or debt', () => {
  const current = new BigNumber(10);

  assert.equal(isIncreaseAllowed(current, new BigNumber(5), false), true);
  assert.equal(isIncreaseAllowed(current, new BigNumber(10), false), true);
  assert.equal(isIncreaseAllowed(current, new BigNumber(11), false), false);
  assert.equal(getActionMaximum(current, new BigNumber(25), false).toFixed(), '10');
});

test('enabled collateral retains increases and the full available maximum', () => {
  const current = new BigNumber(10);
  const maximum = new BigNumber(25);

  assert.equal(isIncreaseAllowed(current, new BigNumber(11), true), true);
  assert.equal(getActionMaximum(current, maximum, true).toFixed(), '25');
});

test('position reads use registered collateral tokens', async () => {
  const hooks = await readFile(new URL('../src/store/collateral/hooks.ts', import.meta.url), 'utf8');
  const totalDataHook = hooks.slice(
    hooks.indexOf('export function useTotalCollateralData'),
    hooks.indexOf('export function useCollateralFetchInfo'),
  );
  const fetchInfoHook = hooks.slice(
    hooks.indexOf('export function useCollateralFetchInfo'),
    hooks.indexOf('export function useCollateralState'),
  );

  assert.match(totalDataHook, /useCollateralTokens\(\)/);
  assert.match(fetchInfoHook, /useCollateralTokens\(\)/);
  assert.doesNotMatch(fetchInfoHook, /supportedCollateralTokens\[symbol\]/);
  assert.doesNotMatch(hooks, /new Set\(\['BTCB'\]\)/);
});
