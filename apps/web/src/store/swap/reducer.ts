import { Currency } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { NETWORK_ID } from 'constants/config';
import { bnUSD, BALN } from 'constants/tokens';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const COMMON_PERCENTS = [25, 50, 75, 100];

export interface SwapState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly [Field.INPUT]: {
    readonly currency: Currency | undefined;
    readonly percent: number;
  };
  readonly [Field.OUTPUT]: {
    readonly currency: Currency | undefined;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null;
}

export const INITIAL_SWAP = {
  base: BALN[NETWORK_ID],
  quote: bnUSD[NETWORK_ID],
};

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currency: INITIAL_SWAP.base,
    percent: 0,
  },
  [Field.OUTPUT]: {
    currency: INITIAL_SWAP.quote,
  },
  recipient: null,
};

const swapSlice = createSlice({
  name: 'swap',
  initialState,
  reducers: create => ({
    replaceSwapState: create.reducer<{
      typedValue: string;
      recipient: string | null;
      field: Field;
      inputCurrency: Currency | undefined;
      outputCurrency: Currency | undefined;
    }>((state, { payload: { typedValue, recipient, field, inputCurrency, outputCurrency } }) => {
      return {
        [Field.INPUT]: {
          currency: inputCurrency,
          percent: 0,
        },
        [Field.OUTPUT]: {
          currency: outputCurrency,
        },
        independentField: field,
        typedValue: typedValue,
        recipient,
      };
    }),
    selectCurrency: create.reducer<{ currency: Currency | undefined; field: Field }>(
      (state, { payload: { currency, field } }) => {
        const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

        if (currency === state[otherField].currency) {
          // the case where we have to swap the order
          return {
            ...state,
            independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
            [field]: { ...state[field], currency: currency, percent: 0 },
            [otherField]: { ...state[otherField], currency: state[field].currency, percent: 0 },
          };
        } else {
          // the normal case
          return {
            ...state,
            [field]: { ...state[field], currency: currency, percent: 0 },
          };
        }
      },
    ),
    selectPercent: create.reducer<{ percent: number; field: Field; value: string }>(
      (state, { payload: { percent, field, value } }) => {
        return {
          ...state,
          independentField: field,
          typedValue: value,
          [field]: { ...state[field], percent: percent },
        };
      },
    ),
    switchCurrencies: create.reducer<void>(state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { ...state[Field.OUTPUT], currency: state[Field.OUTPUT].currency, percent: 0 },
        [Field.OUTPUT]: { ...state[Field.INPUT], currency: state[Field.INPUT].currency },
      };
    }),
    typeInput: create.reducer<{ field: Field; typedValue: string }>((state, { payload: { field, typedValue } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

      return {
        ...state,
        independentField: field,
        typedValue,
        [field]: { ...state[field], percent: 0 },
        [otherField]: { ...state[otherField], percent: 0 },
      };
    }),
    setRecipient: create.reducer<{ recipient: string | null }>((state, { payload: { recipient } }) => {
      state.recipient = recipient;
    }),
  }),
});

export const { replaceSwapState, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } =
  swapSlice.actions;

export default swapSlice.reducer;
