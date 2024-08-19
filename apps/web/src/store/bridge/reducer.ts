import { createSlice } from '@reduxjs/toolkit';

import { XChainId } from '@/types';

import { getXTokenBySymbol } from '@/utils/xTokens';
import { Currency } from '@balancednetwork/sdk-core';

export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export interface BridgeState {
  typedValue: string;
  currency: Currency | undefined;

  [Field.FROM]: {
    chainId: XChainId;
    currency: Currency | undefined;
    percent: number;
  };
  [Field.TO]: {
    chainId: XChainId;
    currency: Currency | undefined;
    percent: number;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  recipient: string | null;
  // when bridging sARCH from ICON to Archway, decide whether unstake sARCH to ARCH using Liquid Finance or keep sARCH
  isLiquidFinanceEnabled: boolean;
}

const initialState: BridgeState = {
  typedValue: '',
  currency: undefined,

  [Field.FROM]: {
    chainId: '0xa4b1.arbitrum',
    currency: undefined,
    percent: 0,
  },
  [Field.TO]: {
    chainId: '0x1.icon',
    currency: undefined,
    percent: 0,
  },
  recipient: null,
  isLiquidFinanceEnabled: false,
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState,
  reducers: create => ({
    selectChain: create.reducer<{ field: Field; chainId: XChainId }>((state, { payload: { field, chainId } }) => {
      const otherField = field === Field.FROM ? Field.TO : Field.FROM;
      if (chainId === state[otherField].chainId) {
        state[otherField].chainId = state[field].chainId;
      }
      state[field].chainId = chainId;
      state.currency = undefined;
    }),

    switchChain: create.reducer<void>(state => {
      const fromChain = state[Field.FROM].chainId;
      state[Field.FROM].chainId = state[Field.TO].chainId;
      state[Field.TO].chainId = fromChain;

      state.currency = getXTokenBySymbol(state[Field.FROM].chainId, state.currency?.symbol);
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

    selectLiquidFinance: create.reducer<boolean>((state, { payload }) => {
      state.isLiquidFinanceEnabled = payload;
    }),
  }),
});

export default bridgeSlice.reducer;

export const { selectChain, typeInput, selectCurrency, setRecipient, switchChain, selectPercent, selectLiquidFinance } =
  bridgeSlice.actions;
