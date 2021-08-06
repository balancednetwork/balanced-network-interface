import { createReducer } from '@reduxjs/toolkit';

import { SUPPORTED_PAIRS } from 'constants/currency';
import { CurrencyKey } from 'types';

import {
  Field,
  replaceSwapState,
  selectCurrency,
  selectInstantAmount,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './actions';

export interface SwapState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly [Field.INPUT]: {
    readonly currencyId: CurrencyKey | undefined;
    readonly instantAmount?: number | undefined;
  };
  readonly [Field.OUTPUT]: {
    readonly currencyId: CurrencyKey | undefined;
    readonly instantAmount?: number | undefined;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null;
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: SUPPORTED_PAIRS[0].baseCurrencyKey,
    instantAmount: undefined,
  },
  [Field.OUTPUT]: {
    currencyId: SUPPORTED_PAIRS[0].quoteCurrencyKey,
    instantAmount: undefined,
  },
  recipient: null,
};

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
        };
      },
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { ...state[field], currencyId: currencyId },
          [otherField]: { ...state[field], currencyId: state[field].currencyId },
        };
      } else {
        // the normal case
        return {
          ...state,
          [field]: { ...state[field], currencyId: currencyId },
        };
      }
    })
    .addCase(selectInstantAmount, (state, { payload: { instantAmount, field } }) => {
      return {
        ...state,
        [field]: { ...state[field], instantAmount: instantAmount },
      };
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { ...state[Field.OUTPUT], currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { ...state[Field.INPUT], currencyId: state[Field.INPUT].currencyId },
      };
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      };
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient;
    }),
);
