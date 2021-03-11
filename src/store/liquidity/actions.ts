import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeLiquiditySupply = createAction<{
  ICXsupply?: BigNumber;
  sICXbnUSDsupply?: BigNumber;
  bnUSDsupply?: BigNumber;
  BALNsupply?: BigNumber;
}>('liquidity/changeLiquiditySupply'); // #redux-note: make sure action name is unique in global store
