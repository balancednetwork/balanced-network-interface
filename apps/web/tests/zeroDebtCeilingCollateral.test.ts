import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('position and aggregate reads use every registered collateral token', async () => {
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
  assert.match(hooks, /queryKey: \['xPositionsData', allWallets, prices, xDepositedAmounts\]/);
});

test('withdrawals resolve collateral contracts from the registered token map', async () => {
  const collateralPanel = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );

  assert.match(collateralPanel, /const \{ data: collateralTokens \} = useCollateralTokens\(\)/);
  assert.match(
    collateralPanel,
    /const collateralTokenAddress =\s*collateralTokens && collateralTokens\[useWrongSymbol\(collateralType\)\]/,
  );
  assert.doesNotMatch(collateralPanel, /useSupportedCollateralTokens|increaseEnabled|isIncreaseAllowed/);
});

test('loan and collateral panels retain their pre-debt-ceiling slider behavior', async () => {
  const collateralPanel = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanel = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.match(
    collateralPanel,
    /BigNumber\.min\(lockedCollateral\.times\(shouldShowLock \? 1\.005 : 1\), collateralTotal\)/,
  );
  assert.match(
    collateralPanel,
    /padding=\{\[Math\.max\(tLockedAmount\.dp\(collateralDecimalPlaces\)\.toNumber\(\), 0\), 0\]\}/,
  );
  assert.doesNotMatch(collateralPanel, /collateralMinimum|walletMaximum|minValue=|increaseEnabled/);

  assert.match(
    loanPanel,
    /padding=\{\[\s*Math\.max\(Math\.min\(usedAmount\.dp\(2\)\.toNumber\(\), borrowableAmountWithReserve\.dp\(2\)\.toNumber\(\)\), 0\),\s*0,\s*\]\}/,
  );
  assert.doesNotMatch(loanPanel, /loanMinimum|availableMaximum|minValue=|increaseEnabled/);
});

test('cross-chain confirmation modals retain their previous action behavior', async () => {
  const xCollateralModal = await readFile(
    new URL('../src/app/components/home/_components/xCollateralModal/index.tsx', import.meta.url),
    'utf8',
  );
  const xLoanModal = await readFile(
    new URL('../src/app/components/home/_components/xLoanModal/index.tsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(xCollateralModal, /increaseEnabled|increaseDisabled/);
  assert.doesNotMatch(xLoanModal, /increaseEnabled|increaseDisabled/);
});
