import { createSlice } from '@reduxjs/toolkit';
import { XChainId } from 'app/pages/trade/bridge/types';
import BigNumber from 'bignumber.js';
import { NETWORK_ID } from 'constants/config';

import { CurrencyKey, IcxDisplayType } from 'types';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface CollateralState {
  depositedAmount: BigNumber;
  collateralType: CurrencyKey;
  collateralXChain: XChainId;
  icxDisplayType: IcxDisplayType;
  depositedAmounts: Partial<Record<XChainId, Record<CurrencyKey, BigNumber>>>;

  // collateral panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: CollateralState = {
  depositedAmount: new BigNumber(0),
  collateralType: 'ETH',
  collateralXChain: '0xa4b1.arbitrum',
  icxDisplayType: 'ICX',
  depositedAmounts: {},
  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
  },
};

const collateralSlice = createSlice({
  name: 'collateral',
  initialState,
  reducers: create => ({
    adjust: create.reducer<void>(state => {
      state.state.isAdjusting = true;
    }),
    cancel: create.reducer<void>(state => {
      state.state.isAdjusting = false;
    }),
    type: create.reducer<{ independentField: Field; typedValue: string; inputType: 'slider' | 'text' }>(
      (state, { payload: { independentField, typedValue, inputType } }) => {
        state.state.independentField = independentField || state.state.independentField;
        state.state.typedValue = typedValue ?? state.state.typedValue;
        state.state.inputType = inputType || state.state.inputType;
      },
    ),
    changeDepositedAmount: create.reducer<{ depositedAmount: BigNumber; token: string; xChain: XChainId }>(
      (state, { payload: { depositedAmount, token, xChain } }) => {
        if (!state.depositedAmounts) {
          state.depositedAmounts = {};
        }
        if (!state.depositedAmounts[xChain]) {
          state.depositedAmounts[xChain] = {};
        }
        state.depositedAmounts[xChain]![token] = depositedAmount;
      },
    ),
    changeCollateralType: create.reducer<{ collateralType: CurrencyKey }>((state, { payload: { collateralType } }) => {
      state.collateralType = collateralType;
    }),
    changeCollateralXChain: create.reducer<{ collateralXChain: XChainId }>(
      (state, { payload: { collateralXChain } }) => {
        state.collateralXChain = collateralXChain;
      },
    ),
    changeIcxDisplayType: create.reducer<{ icxDisplayType: IcxDisplayType }>(
      (state, { payload: { icxDisplayType } }) => {
        state.icxDisplayType = icxDisplayType;
      },
    ),
  }),
});

export const {
  changeDepositedAmount,
  changeCollateralType,
  changeCollateralXChain,
  changeIcxDisplayType,
  adjust,
  cancel,
  type,
} = collateralSlice.actions;

export default collateralSlice.reducer;
