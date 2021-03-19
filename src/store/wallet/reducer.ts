import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeValueBalance } from './actions';

// #redux-step-1: define interface for variable
export interface WalletState {
  ICXbalance?: BigNumber;
  sICXbalance?: BigNumber;
  bnUSDbalance?: BigNumber;
  BALNbalance?: BigNumber;
  BALNreward?: BigNumber;
}

// #redux-step-2: inital state
const initialState: WalletState = {
  ICXbalance: new BigNumber(0),
  sICXbalance: new BigNumber(0),
  bnUSDbalance: new BigNumber(0),
  BALNbalance: new BigNumber(0),
  BALNreward: new BigNumber(0),
};

// #redux-step-7: define function reducer, what happend when the action have dispatch
export default createReducer(initialState, builder =>
  builder.addCase(
    changeValueBalance,
    (state, { payload: { ICXbalance, sICXbalance, bnUSDbalance, BALNbalance, BALNreward } }) => {
      state.BALNbalance = BALNbalance || state.BALNbalance;
      state.ICXbalance = ICXbalance || state.ICXbalance;
      state.sICXbalance = sICXbalance || state.sICXbalance;
      state.bnUSDbalance = bnUSDbalance || state.bnUSDbalance;
      state.BALNreward = BALNreward || state.BALNreward;
    },
  ),
);
