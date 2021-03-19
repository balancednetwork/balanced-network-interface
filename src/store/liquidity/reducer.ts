import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeLiquiditySupply } from './actions';

// #redux-step-1: define interface for variable
export interface LiquidityState {
  ICXsupply?: BigNumber;
  sICXsupply?: BigNumber;
  sICXbnUSDsupply?: BigNumber;
  sICXbnUSDtotalSupply?: BigNumber;
  bnUSDsupply?: BigNumber;
  BALNsupply?: BigNumber;
  sICXICXTotalSupply?: BigNumber;
  ICXBalance?: BigNumber;
}

// #redux-step-2: inital state
const initialState: LiquidityState = {
  ICXsupply: new BigNumber(0),
  sICXsupply: new BigNumber(0),
  sICXbnUSDsupply: new BigNumber(0),
  sICXbnUSDtotalSupply: new BigNumber(0),
  bnUSDsupply: new BigNumber(0),
  BALNsupply: new BigNumber(0),
  sICXICXTotalSupply: new BigNumber(0),
  ICXBalance: new BigNumber(0),
};

// #redux-step-7: define function reducer, what happend when the action have dispatch
export default createReducer(initialState, builder =>
  builder.addCase(
    changeLiquiditySupply,
    (
      state,
      {
        payload: {
          ICXsupply,
          sICXsupply,
          sICXbnUSDsupply,
          bnUSDsupply,
          BALNsupply,
          sICXbnUSDtotalSupply,
          sICXICXTotalSupply,
          ICXBalance,
        },
      },
    ) => {
      state.sICXsupply = sICXsupply || state.sICXsupply;
      state.ICXsupply = ICXsupply || state.ICXsupply;
      state.sICXbnUSDsupply = sICXbnUSDsupply || state.sICXbnUSDsupply;
      state.sICXbnUSDtotalSupply = sICXbnUSDtotalSupply || state.sICXbnUSDtotalSupply;
      state.bnUSDsupply = bnUSDsupply || state.bnUSDsupply;
      state.BALNsupply = BALNsupply || state.BALNsupply;
      state.sICXICXTotalSupply = sICXICXTotalSupply || state.sICXICXTotalSupply;
      state.ICXBalance = ICXBalance || state.ICXBalance;
    },
  ),
);
