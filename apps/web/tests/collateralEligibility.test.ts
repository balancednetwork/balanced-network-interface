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

test('clamps the slider floor when the protected minimum consumes the range', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('605.32'), 2), {
    start: 605.31,
    minimum: 605.31,
    maximum: 605.31,
    padding: [605.31, 0],
  });
  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('605.31'), 2), {
    start: 605.31,
    minimum: 605.31,
    maximum: 605.31,
    padding: [605.31, 0],
  });
});

test('preserves upward borrowing headroom when the requested minimum exceeds the current debt', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(getSafeSliderBounds(new BigNumber('100'), new BigNumber('100.05'), new BigNumber('100.10'), 2), {
    start: 100,
    minimum: 100,
    maximum: 100.05,
    padding: [100, 0],
  });
});

test('preserves valid repayment and withdrawal slider ranges', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('500'), 2), {
    start: 605.31,
    minimum: 500,
    maximum: 605.31,
    padding: [500, 0],
  });
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('237.736999'), new BigNumber('237.736999'), new BigNumber('32.97'), 6),
    {
      start: 237.736999,
      minimum: 32.97,
      maximum: 237.736999,
      padding: [32.97, 0],
    },
  );
});

test('fails closed with safe numeric options for invalid slider bounds', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  const fallbackBounds = {
    start: 0,
    minimum: 0,
    maximum: 0.001,
    padding: [0, 0],
  };

  assert.deepEqual(getSafeSliderBounds(new BigNumber(0), new BigNumber(0), new BigNumber(0), 2), fallbackBounds);
  assert.deepEqual(
    getSafeSliderBounds(
      new BigNumber(Number.POSITIVE_INFINITY),
      new BigNumber(Number.POSITIVE_INFINITY),
      new BigNumber(0),
      2,
    ),
    fallbackBounds,
  );
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('1e400'), new BigNumber('1e400'), new BigNumber(0), 2),
    fallbackBounds,
  );
  assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(20), new BigNumber(-1), 2), {
    start: 10,
    minimum: 10,
    maximum: 20,
    padding: [10, 0],
  });
  assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(20), new BigNumber(Number.NaN), 2), {
    start: 10,
    minimum: 10,
    maximum: 20,
    padding: [10, 0],
  });
});

test('slider panels consume all normalized noUiSlider options', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.match(collateralPanelSource, /start=\{collateralSliderBounds\.start\}/);
  assert.match(collateralPanelSource, /max: \[collateralSliderBounds\.maximum\]/);
  assert.match(loanPanelSource, /start=\{\[loanSliderBounds\.start\]\}/);
  assert.match(loanPanelSource, /max: \[loanSliderBounds\.maximum\]/);
  assert.doesNotMatch(collateralPanelSource, /SLIDER_RANGE_MAX_BOTTOM_THRESHOLD/);
  assert.doesNotMatch(loanPanelSource, /SLIDER_RANGE_MAX_BOTTOM_THRESHOLD/);
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

test('collateral and loan panels use safe slider bounds without frontend movability gating', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');
  const eligibilitySource = await readFile(new URL('../src/store/collateral/eligibility.ts', import.meta.url), 'utf8');

  assert.match(collateralPanelSource, /collateralSliderBounds\.padding/);
  assert.match(collateralPanelSource, /start=\{collateralSliderBounds\.start\}/);
  assert.match(collateralPanelSource, /max: \[collateralSliderBounds\.maximum\]/);
  assert.match(collateralPanelSource, /disabled=\{!isAdjusting\}/);
  assert.match(collateralPanelSource, /const collateralMinimum = new BigNumber\(collateralSliderBounds\.minimum\)/);
  assert.match(
    collateralPanelSource,
    /const walletMaximum = BigNumber\.max\(collateralTotal\.minus\(collateralMinimum\), 0\)/,
  );
  assert.match(collateralPanelSource, /label="Deposited"[\s\S]*?minValue=\{collateralMinimum\}/);
  assert.match(collateralPanelSource, /label="Wallet"[\s\S]*?maxValue=\{walletMaximum\}/);

  assert.match(loanPanelSource, /loanSliderBounds\.padding/);
  assert.match(loanPanelSource, /start=\{\[loanSliderBounds\.start\]\}/);
  assert.match(loanPanelSource, /max: \[loanSliderBounds\.maximum\]/);
  assert.match(loanPanelSource, /disabled=\{!isAdjusting\}/);
  assert.match(loanPanelSource, /const loanMinimum = new BigNumber\(loanSliderBounds\.minimum\)/);
  assert.match(
    loanPanelSource,
    /const availableMaximum = BigNumber\.max\(borrowableAmountWithReserve\.minus\(loanMinimum\), 0\)/,
  );
  assert.equal(loanPanelSource.match(/minValue=\{loanMinimum\}/g)?.length, 2);
  assert.match(loanPanelSource, /label="Available"[\s\S]*?maxValue=\{availableMaximum\}/);

  assert.doesNotMatch(collateralPanelSource, /hasMovableRange/);
  assert.doesNotMatch(loanPanelSource, /hasMovableRange/);
  assert.doesNotMatch(eligibilitySource, /hasMovableRange/);
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
