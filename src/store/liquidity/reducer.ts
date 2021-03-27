import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeLiquiditySupply } from './actions';

// #redux-step-1: define interface for variable
export interface LiquidityState {
  sICXPoolsICXbnUSDTotal?: BigNumber;
  bnUSDPoolsICXbnUSDTotal?: BigNumber;
  sICXbnUSDBalance?: BigNumber;
  sICXbnUSDTotalSupply?: BigNumber;
  BALNPoolBALNbnUSDTotal?: BigNumber;
  bnUSDPoolBALNbnUSDTotal?: BigNumber;
  BALNbnUSDBalance?: BigNumber;
  BALNbnUSDTotalSupply?: BigNumber;
  sICXSuppliedPoolsICXbnUSD?: BigNumber;
  bnUSDSuppliedPoolsICXbnUSD?: BigNumber;
  BALNSuppliedPoolBALNbnUSD?: BigNumber;
  bnUSDSuppliedPoolBALNbnUSD?: BigNumber;
  sICXICXTotalSupply?: BigNumber;
  ICXBalance?: BigNumber;
}

// #redux-step-2: inital state
const initialState: LiquidityState = {
  sICXPoolsICXbnUSDTotal: new BigNumber(0),
  bnUSDPoolsICXbnUSDTotal: new BigNumber(0),
  sICXbnUSDBalance: new BigNumber(0),
  sICXbnUSDTotalSupply: new BigNumber(0),
  BALNPoolBALNbnUSDTotal: new BigNumber(0),
  bnUSDPoolBALNbnUSDTotal: new BigNumber(0),
  BALNbnUSDBalance: new BigNumber(0),
  BALNbnUSDTotalSupply: new BigNumber(0),
  sICXSuppliedPoolsICXbnUSD: new BigNumber(0),
  bnUSDSuppliedPoolsICXbnUSD: new BigNumber(0),
  BALNSuppliedPoolBALNbnUSD: new BigNumber(0),
  bnUSDSuppliedPoolBALNbnUSD: new BigNumber(0),
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
          sICXPoolsICXbnUSDTotal,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDBalance,
          sICXbnUSDTotalSupply,

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXSuppliedPoolsICXbnUSD,
          bnUSDSuppliedPoolsICXbnUSD,

          BALNSuppliedPoolBALNbnUSD,
          bnUSDSuppliedPoolBALNbnUSD,

          sICXICXTotalSupply,
          ICXBalance,
        },
      },
    ) => {
      state.bnUSDPoolsICXbnUSDTotal = bnUSDPoolsICXbnUSDTotal || state.bnUSDPoolsICXbnUSDTotal;
      state.sICXPoolsICXbnUSDTotal = sICXPoolsICXbnUSDTotal || state.sICXPoolsICXbnUSDTotal;
      state.sICXbnUSDBalance = sICXbnUSDBalance || state.sICXbnUSDBalance;
      state.sICXbnUSDTotalSupply = sICXbnUSDTotalSupply || state.sICXbnUSDTotalSupply;

      state.BALNPoolBALNbnUSDTotal = BALNPoolBALNbnUSDTotal || state.BALNPoolBALNbnUSDTotal;
      state.bnUSDPoolBALNbnUSDTotal = bnUSDPoolBALNbnUSDTotal || state.bnUSDPoolBALNbnUSDTotal;
      state.BALNbnUSDBalance = BALNbnUSDBalance || state.BALNbnUSDBalance;
      state.BALNbnUSDTotalSupply = BALNbnUSDTotalSupply || state.BALNbnUSDTotalSupply;

      state.sICXSuppliedPoolsICXbnUSD = sICXSuppliedPoolsICXbnUSD || state.sICXSuppliedPoolsICXbnUSD;
      state.bnUSDSuppliedPoolsICXbnUSD = bnUSDSuppliedPoolsICXbnUSD || state.bnUSDSuppliedPoolsICXbnUSD;

      state.BALNSuppliedPoolBALNbnUSD = BALNSuppliedPoolBALNbnUSD || state.BALNSuppliedPoolBALNbnUSD;
      state.bnUSDSuppliedPoolBALNbnUSD = bnUSDSuppliedPoolBALNbnUSD || state.bnUSDSuppliedPoolBALNbnUSD;

      state.sICXICXTotalSupply = sICXICXTotalSupply || state.sICXICXTotalSupply;
      state.ICXBalance = ICXBalance || state.ICXBalance;
    },
  ),
);
