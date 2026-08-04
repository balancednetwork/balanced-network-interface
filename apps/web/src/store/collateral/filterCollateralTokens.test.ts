import assert from 'node:assert/strict';
import test from 'node:test';

import { filterCollateralTokensByDebtLimit } from './filterCollateralTokens';

test('only returns collateral tokens with a zero debt limit', () => {
  const collateralTokens = {
    sICX: 'cx-sicx',
    BTCB: 'cx-btcb',
    NEW: 'cx-new',
  };

  assert.deepEqual(filterCollateralTokensByDebtLimit(collateralTokens, [0, 0, 100]), {
    sICX: 'cx-sicx',
    BTCB: 'cx-btcb',
  });
});
