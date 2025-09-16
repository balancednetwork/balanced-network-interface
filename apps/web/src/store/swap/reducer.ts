import { getSupportedXChainIdsForIntentToken } from '@/lib/sodax/utils';
import { XToken, convertCurrency, xTokenMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
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
  base: xTokenMap['sui'][0],
  quote: xTokenMap['0xa4b1.arbitrum'][0],
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

        // Check if the selected currency is the same as the other field
        if (currency?.symbol === state[otherField].currency?.symbol) {
          // Check if the currency is supported on multiple xChains using SODAX configuration
          const supportedChainIds = getSupportedXChainIdsForIntentToken(currency);

          if (supportedChainIds.length > 1) {
            const previousCurrency = state[field].currency;
            const previousFieldXChainId = previousCurrency?.xChainId;
            // if the selected currency is multichain and the same as the other field currency,
            // but the other field currency has the same xchainid, switch the xchainIds of the fields
            if (currency?.xChainId === state[otherField].currency?.xChainId && previousFieldXChainId) {
              const newOtherFieldCurrency = convertCurrency(previousFieldXChainId, state[otherField].currency);
              if (newOtherFieldCurrency) {
                return {
                  ...state,
                  [field]: { ...state[field], currency, percent: 0 },
                  [otherField]: { ...state[otherField], currency: newOtherFieldCurrency },
                };
              }
            }

            if (previousCurrency && currency?.xChainId === state[otherField].currency?.xChainId) {
              return {
                ...state,
                [field]: { ...state[field], currency, percent: 0 },
                [otherField]: { ...state[otherField], currency: previousCurrency, percent: 0 },
              };
            }

            // Allow same currency selection if supported on multiple chains
            return {
              ...state,
              [field]: { ...state[field], currency, percent: 0 },
            };
          } else {
            // Fall back to original behavior - switch currencies
            return {
              ...state,
              independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
              [field]: state[otherField],
              [otherField]: state[field],
            };
          }
        } else {
          // Normal case - different currency
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
      const inputCurrency = state[Field.INPUT].currency;
      const outputCurrency = state[Field.OUTPUT].currency;

      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { ...state[Field.OUTPUT], currency: outputCurrency, percent: 0 },
        [Field.OUTPUT]: { ...state[Field.INPUT], currency: inputCurrency },
      };
    }),
    selectChain: create.reducer<{ field: Field; xChainId: XChainId }>((state, { payload: { field, xChainId } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;
      const previousChainId = state[field].currency?.xChainId;

      const updatedCurrency = convertCurrency(xChainId, state[field].currency);

      if (updatedCurrency) {
        state[field].currency = updatedCurrency;
      }

      // Check if both currencies are the same and user is trying to select the same chain
      if (
        state[field].currency?.symbol === state[otherField].currency?.symbol &&
        state[otherField].currency?.xChainId === xChainId
      ) {
        // Switch the chains instead
        if (previousChainId) {
          const updatedOtherCurrency = convertCurrency(previousChainId, state[otherField].currency);
          if (updatedOtherCurrency) {
            state[otherField].currency = updatedOtherCurrency;
          }
        }
      }
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

export const { selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput, selectChain } =
  swapSlice.actions;

export default swapSlice.reducer;
