import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import BigNumber from 'bignumber.js';

import {
  getActionMaximum,
  hasPositiveDebtCeiling,
  isCollateralEnabled,
  isIncreaseAllowed,
  selectEnabledCollateralTokens,
} from '../src/store/collateral/eligibility.ts';

const tokens = { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' };

test('debt ceiling eligibility fails closed', () => {
  assert.equal(hasPositiveDebtCeiling(null), false);
  assert.equal(hasPositiveDebtCeiling(undefined), false);
  assert.equal(hasPositiveDebtCeiling('0x0'), false);
  assert.equal(hasPositiveDebtCeiling('0x1'), true);
});

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

test('collateral and loan transaction handlers guard disabled increases', async () => {
  const collateralPanel = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanel = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');
  const xCollateralModal = await readFile(
    new URL('../src/app/components/home/_components/xCollateralModal/index.tsx', import.meta.url),
    'utf8',
  );
  const xLoanModal = await readFile(
    new URL('../src/app/components/home/_components/xLoanModal/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(collateralPanel, /if \(shouldDeposit && !increaseEnabled\) return/);
  assert.match(loanPanel, /if \(shouldBorrow && !increaseEnabled\) return/);
  assert.match(
    xCollateralModal,
    /if \(storedModalValues\.action === XCollateralAction\.DEPOSIT && !increaseEnabled\) return/,
  );
  assert.match(xLoanModal, /if \(storedModalValues\.action === XLoanAction\.BORROW && !increaseEnabled\) return/);
});
