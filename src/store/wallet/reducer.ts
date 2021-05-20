import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeBalances, resetBalances } from './actions';

// #redux-step-1: define interface for variable
export interface WalletState {
  ICX: BigNumber;
  sICX: BigNumber;
  bnUSD: BigNumber;
  BALN: BigNumber;
  BALNstaked: BigNumber;
  BALNunstaking: BigNumber;
  BALNreward: BigNumber;
}

// #redux-step-2: initial state
const initialState: WalletState = {
  ICX: new BigNumber(0),
  sICX: new BigNumber(0),
  bnUSD: new BigNumber(0),
  BALN: new BigNumber(0),
  BALNstaked: new BigNumber(0),
  BALNunstaking: new BigNumber(0),
  BALNreward: new BigNumber(0),
};

// #redux-step-7: define function reducer, what happened when the action have dispatch
export default createReducer(initialState, builder =>
  builder
    .addCase(
      changeBalances,
      (state, { payload: { ICX, sICX, bnUSD, BALN, BALNstaked, BALNunstaking, BALNreward } }) => {
        state.ICX = ICX || state.ICX;
        state.sICX = sICX || state.sICX;
        state.bnUSD = bnUSD || state.bnUSD;
        state.BALN = BALN || state.BALN;
        state.BALNstaked = BALNstaked || state.BALNstaked;
        state.BALNunstaking = BALNunstaking || state.BALNunstaking;
        state.BALNreward = BALNreward || state.BALNreward;
      },
    )
    .addCase(resetBalances, state => {
      state.ICX = new BigNumber(0);
      state.sICX = new BigNumber(0);
      state.bnUSD = new BigNumber(0);
      state.BALN = new BigNumber(0);
      state.BALNstaked = new BigNumber(0);
      state.BALNunstaking = new BigNumber(0);
      state.BALNreward = new BigNumber(0);
    }),
);
