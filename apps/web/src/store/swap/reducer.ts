import { NETWORK_ID } from '@/constants/config';
import { ICX, wICX } from '@/constants/tokens';
import { getXTokenBySymbol, isXToken } from '@/utils/xTokens';
import { DEFAULT_TOKEN_CHAIN, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChainId } from '@/xwagmi/types';
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
    readonly xChainId: XChainId;
    readonly currency: Currency | undefined;
    readonly percent: number;
  };
  readonly [Field.OUTPUT]: {
    readonly xChainId: XChainId;
    readonly currency: Currency | undefined;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null;
}

const Sui_Sui = xTokenMap['sui'][0];
const BNUSD_BASE = xTokenMap['0x2105.base'][1];

export const INITIAL_SWAP = {
  base: Sui_Sui,
  quote: BNUSD_BASE,
};

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    xChainId: 'sui',
    currency: INITIAL_SWAP.base,
    percent: 0,
  },
  [Field.OUTPUT]: {
    xChainId: '0x2105.base',
    currency: INITIAL_SWAP.quote,
  },
  recipient: null,
};

const swapSlice = createSlice({
  name: 'swap',
  initialState,
  reducers: create => ({
    selectCurrency: create.reducer<{ currency: Currency | undefined; field: Field }>(
      (state, { payload: { currency, field } }) => {
        const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;
        // the case where we have to swap the order
        // and handle icx vs wicx
        if (currency?.symbol === 'ICX' && state[otherField].currency?.symbol === 'wICX') {
          return {
            ...state,
            independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
            [field]: { ...state[otherField], currency: ICX[NETWORK_ID] },
            [otherField]: state[field],
          };
        } else if (currency?.symbol === 'wICX' && state[otherField].currency?.symbol === 'ICX') {
          return {
            ...state,
            independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
            [field]: { ...state[otherField], currency: wICX[NETWORK_ID] },
            [otherField]: state[field],
          };
        } else if (currency?.symbol === state[otherField].currency?.symbol) {
          // the case where we have to swap the order
          return {
            ...state,
            independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
            [field]: state[otherField],
            [otherField]: state[field],
          };
        } else {
          // the normal case
          const xChainId: XChainId =
            currency && isXToken(currency) ? DEFAULT_TOKEN_CHAIN[currency.symbol] ?? '0x1.icon' : '0x1.icon';
          const _currency = currency && isXToken(currency) ? getXTokenBySymbol(xChainId, currency.symbol) : currency;
          return {
            ...state,
            [field]: { ...state[field], currency: _currency, percent: 0, xChainId },
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
      const inputCurrency =
        state[Field.INPUT].currency?.symbol === 'ICX' ? wICX[NETWORK_ID] : state[Field.INPUT].currency;
      const outputCurrency =
        state[Field.OUTPUT].currency?.symbol === 'wICX' ? ICX[NETWORK_ID] : state[Field.OUTPUT].currency;

      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { ...state[Field.OUTPUT], currency: outputCurrency, percent: 0 },
        [Field.OUTPUT]: { ...state[Field.INPUT], currency: inputCurrency },
      };
    }),
    selectChain: create.reducer<{ field: Field; xChainId: XChainId }>((state, { payload: { field, xChainId } }) => {
      const updatedCurrency = getXTokenBySymbol(xChainId, state[field].currency?.symbol);
      if (updatedCurrency) {
        state[field].xChainId = xChainId;
        state[field].currency = updatedCurrency;
      }
    }),
    switchChain: create.reducer<void>(state => {
      const fromChain = state[Field.INPUT].xChainId;
      state[Field.INPUT].xChainId = state[Field.OUTPUT].xChainId;
      state[Field.OUTPUT].xChainId = fromChain;

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
