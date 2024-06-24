import { createSlice } from '@reduxjs/toolkit';
import { XChainId } from 'app/pages/trade/bridge/types';
import BigNumber from 'bignumber.js';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface LoanState {
  badDebt: BigNumber;
  totalSupply: BigNumber;
  totalRepaid: BigNumber;
  totalCollateralSold: BigNumber;
  borrowedAmounts: {
    [CollateralType in string]: {
      [Address in string]: BigNumber;
    };
  };
  lockingRatios: {
    [key in string]: number;
  };

  // loan panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };

  // loan cross-chain recipient network
  recipientNetwork: XChainId;
}

const initialState: LoanState = {
  badDebt: new BigNumber(0),
  totalSupply: new BigNumber(0),
  totalRepaid: new BigNumber(0),
  totalCollateralSold: new BigNumber(0),
  borrowedAmounts: {},
  lockingRatios: {},

  // loan panel UI state
  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
  },

  recipientNetwork: '0xa4b1.arbitrum',
};

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: create => ({
    adjust: create.reducer<void>(state => {
      state.state.isAdjusting = true;
    }),
    cancel: create.reducer<void>(state => {
      // reset typedValue, independentField, isAdjusting values
      state.state.isAdjusting = false;
    }),
    type: create.reducer<{ independentField: Field; typedValue: string; inputType: 'slider' | 'text' }>(
      (state, { payload: { independentField, typedValue, inputType } }) => {
        state.state.independentField = independentField || state.state.independentField;
        state.state.typedValue = typedValue ?? state.state.typedValue;
        state.state.inputType = inputType || state.state.inputType;
      },
    ),
    changeBorrowedAmount: create.reducer<{ borrowedAmount: BigNumber; address: string; collateralType: string }>(
      (state, { payload: { borrowedAmount, address, collateralType } }) => {
        if (!state.borrowedAmounts[collateralType]) {
          state.borrowedAmounts[collateralType] = {};
        }
        state.borrowedAmounts[collateralType][address] = borrowedAmount;
      },
    ),
    changeBadDebt: create.reducer<{ badDebt: BigNumber }>((state, { payload: { badDebt } }) => {
      state.badDebt = badDebt;
    }),
    changeTotalSupply: create.reducer<{ totalSupply: BigNumber }>((state, { payload: { totalSupply } }) => {
      state.totalSupply = totalSupply;
    }),
    setLockingRatio: create.reducer<{ lockingRatio: number; collateralType: string }>(
      (state, { payload: { lockingRatio, collateralType } }) => {
        state.lockingRatios[collateralType] = lockingRatio;
      },
    ),
    setRecipientNetwork: create.reducer<{ recipientNetwork: XChainId }>((state, { payload: { recipientNetwork } }) => {
      state.recipientNetwork = recipientNetwork;
    }),
  }),
});

export const {
  changeBorrowedAmount,
  changeBadDebt,
  changeTotalSupply,
  adjust,
  cancel,
  type,
  setLockingRatio,
  setRecipientNetwork,
} = loanSlice.actions;

export default loanSlice.reducer;
