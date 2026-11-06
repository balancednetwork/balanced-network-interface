import assert from 'node:assert/strict';
import test from 'node:test';

import { formatValue } from '../src/utils/formatter.ts';

test('non-finite numeric values render the unavailable placeholder instead of throwing', () => {
  assert.equal(formatValue('NaN'), '$-.--');
  assert.equal(formatValue(Number.NaN), '$-.--');
  assert.equal(formatValue('Infinity'), '$-.--');
  assert.equal(formatValue(Number.POSITIVE_INFINITY, false), '-.--');
});
