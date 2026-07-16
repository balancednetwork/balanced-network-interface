import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import BigNumber from 'bignumber.js';

import {
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
});

test('enabled collateral retains increases', () => {
  const current = new BigNumber(10);

  assert.equal(isIncreaseAllowed(current, new BigNumber(11), true), true);
});

test('position sliders use their historical full ranges and displayed thresholds', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.match(
    collateralPanelSource,
    /const collateralMinimum = BigNumber\.max\(tLockedAmount\.dp\(collateralDecimalPlaces\), 0\)/,
  );
  assert.match(collateralPanelSource, /start=\{collateralDeposit\.toNumber\(\)\}/);
  assert.match(collateralPanelSource, /padding=\{\[collateralMinimum\.toNumber\(\), 0\]\}/);
  assert.match(collateralPanelSource, /collateralTotal\.dp\(collateralDecimalPlaces\)\.toNumber\(\)/);
  assert.doesNotMatch(collateralPanelSource, /actionMaximum|getSafeSliderBounds|collateralSliderBounds/);

  assert.match(
    loanPanelSource,
    /const loanMinimum = BigNumber\.max\(\s*BigNumber\.min\(usedAmount\.dp\(2\), borrowableAmountWithReserve\.dp\(2\)\),\s*0,?\s*\)/,
  );
  assert.match(loanPanelSource, /start=\{\[borrowedAmount\.dp\(2\)\.toNumber\(\)\]\}/);
  assert.match(loanPanelSource, /padding=\{\[loanMinimum\.toNumber\(\), 0\]\}/);
  assert.match(loanPanelSource, /borrowableAmountWithReserve\.dp\(2\)\.toNumber\(\)/);
  assert.doesNotMatch(loanPanelSource, /actionMaximum|getSafeSliderBounds|loanSliderBounds/);
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

test('collateral and loan panels clamp manual input to the displayed thresholds', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');
  const eligibilitySource = await readFile(new URL('../src/store/collateral/eligibility.ts', import.meta.url), 'utf8');

  assert.match(collateralPanelSource, /disabled=\{!isAdjusting\}/);
  assert.match(
    collateralPanelSource,
    /const collateralMinimum = BigNumber\.max\(tLockedAmount\.dp\(collateralDecimalPlaces\), 0\)/,
  );
  assert.match(
    collateralPanelSource,
    /const walletMaximum = BigNumber\.max\(collateralTotal\.minus\(collateralMinimum\), 0\)/,
  );
  assert.match(collateralPanelSource, /label="Deposited"[\s\S]*?minValue=\{collateralMinimum\}/);
  assert.match(collateralPanelSource, /label="Wallet"[\s\S]*?maxValue=\{walletMaximum\}/);

  assert.match(loanPanelSource, /disabled=\{!isAdjusting\}/);
  assert.match(
    loanPanelSource,
    /const loanMinimum = BigNumber\.max\(\s*BigNumber\.min\(usedAmount\.dp\(2\), borrowableAmountWithReserve\.dp\(2\)\),\s*0,?\s*\)/,
  );
  assert.match(
    loanPanelSource,
    /const availableMaximum = BigNumber\.max\(borrowableAmountWithReserve\.minus\(loanMinimum\), 0\)/,
  );
  assert.equal(loanPanelSource.match(/minValue=\{loanMinimum\}/g)?.length, 2);
  assert.match(loanPanelSource, /label="Available"[\s\S]*?maxValue=\{availableMaximum\}/);

  assert.doesNotMatch(collateralPanelSource, /hasMovableRange/);
  assert.doesNotMatch(loanPanelSource, /hasMovableRange/);
  assert.doesNotMatch(eligibilitySource, /hasMovableRange|getSafeSliderBounds|getActionMaximum/);
});

test('position adjustment controls are independent of slider movability', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(collateralPanelSource, /const canAdjustCollateral =/);
  assert.doesNotMatch(collateralPanelSource, /if \(!canAdjustCollateral\) return/);
  assert.match(collateralPanelSource, /account && collateralTotal\?\.isGreaterThan\(0\) && \(/);
  assert.match(collateralPanelSource, /disabled=\{!isAdjusting\}/);

  assert.doesNotMatch(loanPanelSource, /const canAdjustLoan =/);
  assert.doesNotMatch(loanPanelSource, /if \(!canAdjustLoan\) return/);
  assert.match(loanPanelSource, /\{account && \(/);
  assert.match(loanPanelSource, /disabled=\{!isAdjusting\}/);
});
