import { Currency } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

import { Field, resetMintState, typeInput, selectCurrency } from './actions';

export interface MintState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly otherTypedValue: string; // for the case when there's no liquidity
  readonly inputType: string; // for the case when there's no liquidity
  readonly [Field.CURRENCY_A]: {
    readonly currency: Currency | undefined;
    readonly percent: number;
  };
  readonly [Field.CURRENCY_B]: {
    readonly currency: Currency | undefined;
  };
}

const initialState: MintState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  otherTypedValue: '',
  inputType: 'text',
  [Field.CURRENCY_A]: {
    currency: SUPPORTED_TOKENS_LIST[0],
    percent: 0,
  },
  [Field.CURRENCY_B]: {
    currency: SUPPORTED_TOKENS_LIST[1],
  },
};

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity, inputType } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue,
            inputType,
          };
        }
        // they're typing into a new field, store the other value
        else {
          return {
            ...state,
            independentField: field,
            typedValue,
            otherTypedValue: state.typedValue,
            inputType,
          };
        }
      } else {
        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: '',
          inputType,
        };
      }
    })
    .addCase(selectCurrency, (state, { payload: { currency, field } }) => {
      // const otherField = field === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

      // if (currency === state[otherField].currency) {
      //   // the case where we have to swap the order
      //   return {
      //     ...state,
      //     independentField: state.independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A,
      //     [field]: { ...state[field], currency: currency, percent: 0 },
      //     [otherField]: { ...state[otherField], currency: state[field].currency, percent: 0 },
      //   };
      // } else {
      // the normal case
      return {
        ...state,
        [field]: { ...state[field], currency: currency, percent: 0 },
      };
      // }
    }),
);
