import { XChainId } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { ICON_XCALL_NETWORK_ID, XToken, convertCurrency, xTokenMapBySymbol } from '@balancednetwork/xwagmi';

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
    readonly currency: XToken | undefined;
    readonly percent: number;
  };
  readonly [Field.CURRENCY_B]: {
    readonly currency: XToken | undefined;
  };
}

export const INITIAL_MINT = {
  currencyA: xTokenMapBySymbol[ICON_XCALL_NETWORK_ID]['wICX'],
  currencyB: xTokenMapBySymbol[ICON_XCALL_NETWORK_ID]['sICX'],
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
    selectCurrency: create.reducer<{ currency: XToken; field: Field }>((state, { payload: { currency, field } }) => {
      return {
        ...state,
        [field]: { ...state[field], currency: currency, percent: 0 },
      };
    }),

    selectChain: create.reducer<{ field: Field; xChainId: XChainId }>((state, { payload: { field, xChainId } }) => {
      const updatedCurrencyA = convertCurrency(xChainId, state[Field.CURRENCY_A].currency);
      if (updatedCurrencyA) {
        state[Field.CURRENCY_A].currency = updatedCurrencyA;

        const updatedCurrencyB = convertCurrency(xChainId, state[Field.CURRENCY_B].currency)!;
        if (updatedCurrencyB.xChainId !== state[Field.CURRENCY_B].currency?.xChainId) {
          state[Field.CURRENCY_B].currency = updatedCurrencyB;
        }
      }
    }),
  }),
});

export const { resetMintState, typeInput, selectCurrency, selectChain } = mintSlice.actions;

export default mintSlice.reducer;
