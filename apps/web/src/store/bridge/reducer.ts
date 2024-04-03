import { createSlice } from '@reduxjs/toolkit';

import { SupportedXCallChains } from 'app/_xcall/types';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { getCrossChainTokenBySymbol } from 'app/_xcall/utils';

export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export interface BridgeState {
  typedValue: string;
  currency: Currency | undefined;

  [Field.FROM]: {
    chain: SupportedXCallChains;
    currency: Currency | undefined;
    percent: number;
  };
  [Field.TO]: {
    chain: SupportedXCallChains;
    currency: Currency | undefined;
    percent: number;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  recipient: string | null;
}

const initialState: BridgeState = {
  typedValue: '',
  currency: undefined,

  [Field.FROM]: {
    chain: 'archway',
    currency: undefined,
    percent: 0,
  },
  [Field.TO]: {
    chain: 'icon',
    currency: undefined,
    percent: 0,
  },
  recipient: null,
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState,
  reducers: create => ({
    selectChain: create.reducer<{ field: Field; chain: SupportedXCallChains }>(
      (state, { payload: { field, chain } }) => {
        const otherField = field === Field.FROM ? Field.TO : Field.FROM;
        if (chain === state[otherField].chain) {
          state[otherField].chain = state[field].chain;
        }
        state[field].chain = chain;
        state.currency = undefined;
      },
    ),

    switchChain: create.reducer<void>(state => {
      const fromChain = state[Field.FROM].chain;
      state[Field.FROM].chain = state[Field.TO].chain;
      state[Field.TO].chain = fromChain;

      state.currency = getCrossChainTokenBySymbol(state[Field.FROM].chain, state.currency?.symbol);
      // const fromCurrency = state[Field.FROM].currency;
      // state[Field.FROM].currency = state[Field.TO].currency;
      // state[Field.TO].currency = fromCurrency;
      // state.currency = undefined;
    }),

    typeInput: create.reducer<string>((state, { payload }) => {
      state.typedValue = payload;
      state[Field.FROM].percent = 0;
    }),

    selectCurrency: create.reducer<{ currency: Currency | undefined }>((state, { payload: { currency } }) => {
      state.currency = currency;
    }),

    setRecipient: create.reducer<string | null>((state, { payload }) => {
      state.recipient = payload;
    }),

    selectPercent: create.reducer<{ field: Field; percent: number; value: string }>(
      (state, { payload: { field, percent, value } }) => {
        state[field].percent = percent;
        state.typedValue = value;
      },
    ),
  }),
});

export default bridgeSlice.reducer;

export const { selectChain, typeInput, selectCurrency, setRecipient, switchChain, selectPercent } = bridgeSlice.actions;
