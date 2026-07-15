import assert from 'node:assert/strict';
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
  const enabled = selectEnabledCollateralTokens(tokens, new Set<string>(), new Set(['BTCB']));

  assert.deepEqual(tokens, { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' });
  assert.deepEqual(enabled, { BTCB: 'cx-btcb' });
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
