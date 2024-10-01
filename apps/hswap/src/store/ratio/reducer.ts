import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export interface RatioState {
  ICXUSDratio: BigNumber;
  sICXbnUSDratio: BigNumber;
  sICXICXratio: BigNumber;
  BALNbnUSDratio: BigNumber;
  BALNsICXratio: BigNumber;
}

const initialState: RatioState = {
  ICXUSDratio: new BigNumber(0),
  sICXbnUSDratio: new BigNumber(0),
  sICXICXratio: new BigNumber(0),
  BALNbnUSDratio: new BigNumber(0),
  BALNsICXratio: new BigNumber(0),
};

const ratioSlice = createSlice({
  name: 'ratio',
  initialState,
  reducers: create => ({
    changeRatioValue: create.reducer<Partial<RatioState>>(
      (state, { payload: { ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio, BALNsICXratio } }) => {
        state.ICXUSDratio = ICXUSDratio || state.ICXUSDratio;
        state.sICXbnUSDratio = sICXbnUSDratio || state.sICXbnUSDratio;
        state.sICXICXratio = sICXICXratio || state.sICXICXratio;
        state.BALNbnUSDratio = BALNbnUSDratio || state.BALNbnUSDratio;
        state.BALNsICXratio = BALNsICXratio || state.BALNsICXratio;
      },
    ),
  }),
});

export const { changeRatioValue } = ratioSlice.actions;

export default ratioSlice.reducer;
