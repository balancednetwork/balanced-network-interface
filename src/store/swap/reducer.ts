import { Currency } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { NETWORK_ID } from 'constants/config';
import { bnUSD, BALN } from 'constants/tokens';

import {
  Field,
  replaceSwapState,
  selectCurrency,
  selectPercent,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './actions';

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

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrency, outputCurrency } }) => {
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
      },
    )
    .addCase(selectCurrency, (state, { payload: { currency, field } }) => {
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
    })
    .addCase(selectPercent, (state, { payload: { percent, field, value } }) => {
      return {
        ...state,
        independentField: field,
        typedValue: value,
        [field]: { ...state[field], percent: percent },
      };
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { ...state[Field.OUTPUT], currency: state[Field.OUTPUT].currency, percent: 0 },
        [Field.OUTPUT]: { ...state[Field.INPUT], currency: state[Field.INPUT].currency },
      };
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

      return {
        ...state,
        independentField: field,
        typedValue,
        [field]: { ...state[field], percent: 0 },
        [otherField]: { ...state[otherField], percent: 0 },
      };
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient;
    }),
);
