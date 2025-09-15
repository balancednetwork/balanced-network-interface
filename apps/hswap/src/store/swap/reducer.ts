import { XToken, xTokenMap } from '@balancednetwork/xwagmi';
import { createSlice } from '@reduxjs/toolkit';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const COMMON_PERCENTS = [25, 50, 75, 100];

export interface SwapState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly [Field.INPUT]: {
    readonly currency: XToken | undefined;
    readonly percent: number;
  };
  readonly [Field.OUTPUT]: {
    readonly currency: XToken | undefined;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null;
}

export const INITIAL_SWAP = {
  base: xTokenMap['sui'][0], // SUI on Sui
  quote: xTokenMap['0x2105.base'][1], // bnUSD on Base
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
    selectCurrency: create.reducer<{ currency: XToken | undefined; field: Field }>(
      (state, { payload: { currency, field } }) => {
        const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

        if (currency?.address === state[otherField].currency?.address) {
          // the case where we have to swap the order
          return {
            ...state,
            independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
            [field]: state[otherField],
            [otherField]: state[field],
          };
        } else {
          // the normal case
          return {
            ...state,
            [field]: { ...state[field], currency, percent: 0 },
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

export const { selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } = swapSlice.actions;

export default swapSlice.reducer;
