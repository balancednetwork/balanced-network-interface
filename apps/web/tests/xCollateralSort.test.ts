import assert from 'node:assert/strict';
import test from 'node:test';

import BigNumber from 'bignumber.js';

import { DEFAULT_X_COLLATERAL_SORT, sortXCollateralTypes } from '../src/hooks/xCollateralSort.ts';

type PositionFixture = {
  collateral?: string;
  loan?: string;
  isPotential?: boolean;
};

const position = ({ collateral = '0', loan = '0', isPotential = false }: PositionFixture) => ({
  collateral: {
    toFixed: () => collateral,
  },
  loan: new BigNumber(loan),
  isPotential,
});

const record = (
  symbol: string,
  totalCollateral: string,
  totalLoan: string,
  positions: Record<string, ReturnType<typeof position>> = {},
) =>
  ({
    baseToken: { symbol },
    positions,
    isSingleChain: true,
    total: position({ collateral: totalCollateral, loan: totalLoan }),
  }) as never;

const symbols = (records: ReturnType<typeof record>[]) => records.map(item => item.baseToken.symbol);

test('the default ordering puts the highest loan first', () => {
  const records = [record('ETH', '20', '5'), record('sICX', '10', '100'), record('BTC', '30', '25')];

  const sorted = sortXCollateralTypes(records, 'all', DEFAULT_X_COLLATERAL_SORT, {}, true);

  assert.deepEqual(symbols(sorted), ['sICX', 'BTC', 'ETH']);
});

test('All collateral sorting follows raw token amounts without oracle prices in both directions', () => {
  const records = [record('afSUI', '5', '0'), record('ETH', '2', '0'), record('BTC', '10', '0')];

  const descending = sortXCollateralTypes(records, 'all', { key: 'collateral', order: 'DESC' }, {}, true);
  const ascending = sortXCollateralTypes(records, 'all', { key: 'collateral', order: 'ASC' }, {}, true);

  assert.deepEqual(symbols(descending), ['BTC', 'afSUI', 'ETH']);
  assert.deepEqual(symbols(ascending), ['ETH', 'afSUI', 'BTC']);
});

test('a missing Your collateral price sorts as zero instead of pinning the row', () => {
  const records = [
    record('afSUI', '0', '0', { sui: position({ collateral: '100' }) }),
    record('ETH', '0', '0', { eth: position({ collateral: '2' }) }),
  ];
  const prices = { ETH: new BigNumber(10) };

  const descending = sortXCollateralTypes(records, 'your', { key: 'collateral', order: 'DESC' }, prices, true);
  const ascending = sortXCollateralTypes(records, 'your', { key: 'collateral', order: 'ASC' }, prices, true);

  assert.deepEqual(symbols(descending), ['ETH', 'afSUI']);
  assert.deepEqual(symbols(ascending), ['afSUI', 'ETH']);
});

test('actual Your collateral sorts ahead of potential wallet balances in both directions', () => {
  const records = [
    record('POTENTIAL', '0', '0', { wallet: position({ collateral: '100', isPotential: true }) }),
    record('DEPOSITED_HIGH', '0', '0', { position: position({ collateral: '10' }) }),
    record('DEPOSITED_LOW', '0', '0', { position: position({ collateral: '1' }) }),
  ];
  const prices = {
    POTENTIAL: new BigNumber(1),
    DEPOSITED_HIGH: new BigNumber(1),
    DEPOSITED_LOW: new BigNumber(1),
  };

  const descending = sortXCollateralTypes(records, 'your', { key: 'collateral', order: 'DESC' }, prices, true);
  const ascending = sortXCollateralTypes(records, 'your', { key: 'collateral', order: 'ASC' }, prices, true);

  assert.deepEqual(symbols(descending), ['DEPOSITED_HIGH', 'DEPOSITED_LOW', 'POTENTIAL']);
  assert.deepEqual(symbols(ascending), ['DEPOSITED_LOW', 'DEPOSITED_HIGH', 'POTENTIAL']);
});

test('equal names, collateral amounts, and loans preserve input order', () => {
  const equalNames = [record('sICX', '1', '1'), record('ICX', '2', '2')];
  const equalCollateral = [record('FIRST', '10', '1'), record('SECOND', '10', '2')];
  const equalLoans = [record('FIRST', '1', '10'), record('SECOND', '2', '10')];

  assert.deepEqual(symbols(sortXCollateralTypes(equalNames, 'all', { key: 'name', order: 'ASC' }, {}, true)), [
    'sICX',
    'ICX',
  ]);
  assert.deepEqual(
    symbols(sortXCollateralTypes(equalCollateral, 'all', { key: 'collateral', order: 'DESC' }, {}, true)),
    ['FIRST', 'SECOND'],
  );
  assert.deepEqual(symbols(sortXCollateralTypes(equalLoans, 'all', { key: 'loan', order: 'DESC' }, {}, true)), [
    'FIRST',
    'SECOND',
  ]);
});
