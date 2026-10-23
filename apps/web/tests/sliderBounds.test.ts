import assert from 'node:assert/strict';
import test from 'node:test';

import BigNumber from 'bignumber.js';

import { getSafeSliderBounds } from '../src/utils/sliderBounds.ts';

test('preserves valid repayment and withdrawal ranges', () => {
  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('700'), new BigNumber('500'), 2), {
    start: 605.31,
    maximum: 700,
    padding: [500, 0],
    hasMovableRange: true,
  });
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('237.736999'), new BigNumber('237.736999'), new BigNumber('32.97'), 6),
    {
      start: 237.736999,
      maximum: 237.736999,
      padding: [32.97, 0],
      hasMovableRange: true,
    },
  );
});

test('clamps a protected minimum above the current value without consuming available headroom', () => {
  assert.deepEqual(getSafeSliderBounds(new BigNumber('100'), new BigNumber('100.05'), new BigNumber('100.10'), 2), {
    start: 100,
    maximum: 100.05,
    padding: [100, 0],
    hasMovableRange: true,
  });
});

test('collapses safely when the protected minimum consumes the full range', () => {
  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('605.31'), 2), {
    start: 605.31,
    maximum: 605.31,
    padding: [0, 0],
    hasMovableRange: false,
  });
  assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('605.32'), 2), {
    start: 605.31,
    maximum: 605.31,
    padding: [0, 0],
    hasMovableRange: false,
  });
});

test('uses finite disabled fallback options for invalid start and maximum values', () => {
  const fallback = {
    start: 0,
    maximum: 0.001,
    padding: [0, 0],
    hasMovableRange: false,
  };

  assert.deepEqual(getSafeSliderBounds(new BigNumber(0), new BigNumber(0), new BigNumber(0), 2), fallback);
  assert.deepEqual(getSafeSliderBounds(new BigNumber(-1), new BigNumber(10), new BigNumber(0), 2), fallback);
  assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(5), new BigNumber(0), 2), fallback);
  assert.deepEqual(
    getSafeSliderBounds(
      new BigNumber(Number.POSITIVE_INFINITY),
      new BigNumber(Number.POSITIVE_INFINITY),
      new BigNumber(0),
      2,
    ),
    fallback,
  );
  assert.deepEqual(getSafeSliderBounds(new BigNumber('1e400'), new BigNumber('1e400'), new BigNumber(0), 2), fallback);
});

test('invalid protected minimum values disable movement while retaining a valid range', () => {
  const collapsed = {
    start: 10,
    maximum: 20,
    padding: [0, 0],
    hasMovableRange: false,
  };

  assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(20), new BigNumber(-1), 2), collapsed);
  assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(20), new BigNumber(Number.NaN), 2), collapsed);
});
