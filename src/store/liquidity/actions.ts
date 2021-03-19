import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeLiquiditySupply = createAction<{
  ICXsupply?: BigNumber;
  sICXsupply?: BigNumber;
  sICXbnUSDsupply?: BigNumber;
  sICXbnUSDtotalSupply?: BigNumber;
  bnUSDsupply?: BigNumber;
  BALNsupply?: BigNumber;
  sICXICXTotalSupply?: BigNumber;
  ICXBalance?: BigNumber;
}>('liquidity/changeLiquiditySupply'); // #redux-note: make sure action name is unique in global store
