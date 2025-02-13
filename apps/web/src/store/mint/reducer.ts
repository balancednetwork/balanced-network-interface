import { Currency } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { NETWORK_ID } from '@/constants/config';
import { ICX, sICX } from '@/constants/tokens';

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export enum InputType {
  text,
  slider,
}

export interface MintState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly otherTypedValue: string;
  readonly inputType: InputType;
  readonly [Field.CURRENCY_A]: {
    readonly currency: Currency | undefined;
    readonly percent: number;
  };
  readonly [Field.CURRENCY_B]: {
    readonly currency: Currency | undefined;
  };
}

export const INITIAL_MINT = {
  currencyA: ICX[NETWORK_ID],
  currencyB: sICX[NETWORK_ID],
};

const initialState: MintState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  otherTypedValue: '',
  inputType: InputType.text,
  [Field.CURRENCY_A]: {
    currency: INITIAL_MINT.currencyA,
    percent: 0,
  },
  [Field.CURRENCY_B]: {
    currency: INITIAL_MINT.currencyB,
  },
};

const mintSlice = createSlice({
  name: 'mint',
  initialState,
  reducers: create => ({
    resetMintState: create.reducer<void>(() => initialState),
    typeInput: create.reducer<{ field: Field; typedValue: string; noLiquidity: boolean; inputType: InputType }>(
      (state, { payload: { field, typedValue, noLiquidity, inputType } }) => {
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
      },
    ),
    selectCurrency: create.reducer<{ currency: Currency; field: Field }>((state, { payload: { currency, field } }) => {
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
  }),
});

export const { resetMintState, typeInput, selectCurrency } = mintSlice.actions;

export default mintSlice.reducer;
