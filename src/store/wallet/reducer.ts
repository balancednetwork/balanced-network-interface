import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeValueBalance } from './actions';

// #redux-step-1: define interface for variable
export interface WalletState {
  sICXbalance?: BigNumber;
  bnUSDbalance?: BigNumber;
  BALNbalance?: BigNumber;
}

// #redux-step-2: inital state
const initialState: WalletState = {
  sICXbalance: new BigNumber(0),
  bnUSDbalance: new BigNumber(0),
  BALNbalance: new BigNumber(0),
};

// #redux-step-7: define function reducer, what happend when the action have dispatch
export default createReducer(initialState, builder =>
  builder.addCase(changeValueBalance, (state, { payload: { sICXbalance, bnUSDbalance, BALNbalance } }) => {
    state.BALNbalance = BALNbalance || state.BALNbalance;
    state.sICXbalance = sICXbalance || state.sICXbalance;
    state.bnUSDbalance = bnUSDbalance || state.bnUSDbalance;
  }),
);
