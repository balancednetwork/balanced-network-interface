import { getXTokenBySymbol, isXToken } from '@/utils/xTokens';
import { DEFAULT_TOKEN_CHAIN, allXTokens, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChainId, XToken } from '@balancednetwork/sdk-core';
import { Currency } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

// !TODO: use one Field for swap and bridge panel
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
  base: allXTokens[0],
  quote: allXTokens[11],
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
    selectChain: create.reducer<{ field: Field; xChainId: XChainId }>((state, { payload: { field, xChainId } }) => {
      const updatedCurrency = getXTokenBySymbol(xChainId, state[field].currency?.symbol);
      if (updatedCurrency) {
        state[field].currency = updatedCurrency;
      }
    }),
    switchChain: create.reducer<void>(state => {
      const fromCurrency = state[Field.INPUT].currency;
      state[Field.INPUT].currency = state[Field.OUTPUT].currency;
      state[Field.OUTPUT].currency = fromCurrency;
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

export const { selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput, switchChain, selectChain } =
  swapSlice.actions;

export default swapSlice.reducer;
