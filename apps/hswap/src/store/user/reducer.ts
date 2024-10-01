import { createSlice } from '@reduxjs/toolkit';

import { SupportedLocale } from '@/constants/locales';
import { DEFAULT_DEADLINE_FROM_NOW } from '@/constants/misc';

const currentTimestamp = () => new Date().getTime();

export interface SerializedToken {
  chainId: number | string;
  address: string;
  decimals: number;
  symbol: string;
  name?: string;
}

interface SerializedPair {
  token0: SerializedToken;
  token1: SerializedToken;
}
export interface UserState {
  arbitrumAlphaAcknowledged: boolean;

  // the timestamp of the last updateVersion action
  lastUpdateVersionTimestamp?: number;

  matchesDarkMode: boolean; // whether the dark mode media query matches
  optimismAlphaAcknowledged: boolean;

  userDarkMode: boolean | null; // the user's choice for dark mode or light mode
  userLocale: SupportedLocale | null;

  userExpertMode: boolean;

  userClientSideRouter: boolean; // whether routes should be calculated with the client side router only

  // hides closed (inactive) positions across the app
  userHideClosedPositions: boolean;

  // user defined slippage tolerance in bips, used in all txns
  userSlippageTolerance: number | 'auto';
  userSlippageToleranceHasBeenMigratedToAuto: boolean; // temporary flag for migration status

  // deadline set by user in minutes, used in all txns
  userDeadline: number;

  tokens: {
    [chainId: number]: {
      [address: string]: SerializedToken;
    };
  };

  pairs: {
    [chainId: number]: {
      // keyed by token0Address:token1Address
      [key: string]: SerializedPair;
    };
  };

  timestamp: number;
  URLWarningVisible: boolean;
}

function pairKey(token0Address: string, token1Address: string) {
  return `${token0Address};${token1Address}`;
}

const initialState: UserState = {
  arbitrumAlphaAcknowledged: false,
  matchesDarkMode: false,
  optimismAlphaAcknowledged: false,
  userDarkMode: null,
  userLocale: null,
  userExpertMode: false,
  userClientSideRouter: false,
  userHideClosedPositions: false,
  userSlippageTolerance: 'auto',
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  pairs: {},
  timestamp: currentTimestamp(),
  URLWarningVisible: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: create => ({
    updateVersion: create.reducer<void>(state => {
      // slippage isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (
        typeof state.userSlippageTolerance !== 'number' ||
        !Number.isInteger(state.userSlippageTolerance) ||
        state.userSlippageTolerance < 0 ||
        state.userSlippageTolerance > 5000
      ) {
        state.userSlippageTolerance = 'auto';
      } else {
        if (
          !state.userSlippageToleranceHasBeenMigratedToAuto &&
          [10, 50, 100].indexOf(state.userSlippageTolerance) !== -1
        ) {
          state.userSlippageTolerance = 'auto';
          state.userSlippageToleranceHasBeenMigratedToAuto = true;
        }
      }

      // deadline isnt being tracked in local storage, reset to default
      // noinspection SuspiciousTypeOfGuard
      if (
        typeof state.userDeadline !== 'number' ||
        !Number.isInteger(state.userDeadline) ||
        state.userDeadline < 60 ||
        state.userDeadline > 180 * 60
      ) {
        state.userDeadline = DEFAULT_DEADLINE_FROM_NOW;
      }

      state.lastUpdateVersionTimestamp = currentTimestamp();
    }),
    updateUserDarkMode: create.reducer<{ userDarkMode: boolean }>((state, { payload: { userDarkMode } }) => {
      state.userDarkMode = userDarkMode;
      state.timestamp = currentTimestamp();
    }),
    updateMatchesDarkMode: create.reducer<{ matchesDarkMode: boolean }>((state, { payload: { matchesDarkMode } }) => {
      state.matchesDarkMode = matchesDarkMode;
      state.timestamp = currentTimestamp();
    }),
    updateUserLocale: create.reducer<{ userLocale: SupportedLocale }>((state, { payload: { userLocale } }) => {
      state.userLocale = userLocale;
      state.timestamp = currentTimestamp();
    }),
    updateArbitrumAlphaAcknowledged: create.reducer<{ arbitrumAlphaAcknowledged: boolean }>(
      (state, { payload: { arbitrumAlphaAcknowledged } }) => {
        state.arbitrumAlphaAcknowledged = arbitrumAlphaAcknowledged;
      },
    ),
    updateOptimismAlphaAcknowledged: create.reducer<{ optimismAlphaAcknowledged: boolean }>(
      (state, { payload: { optimismAlphaAcknowledged } }) => {
        state.optimismAlphaAcknowledged = optimismAlphaAcknowledged;
      },
    ),
    updateUserExpertMode: create.reducer<{ userExpertMode: boolean }>((state, { payload: { userExpertMode } }) => {
      state.userExpertMode = userExpertMode;
      state.timestamp = currentTimestamp();
    }),
    updateUserSlippageTolerance: create.reducer<{ userSlippageTolerance: number | 'auto' }>(
      (state, { payload: { userSlippageTolerance } }) => {
        state.userSlippageTolerance = userSlippageTolerance;
        state.timestamp = currentTimestamp();
      },
    ),
    updateUserDeadline: create.reducer<{ userDeadline: number }>((state, { payload: { userDeadline } }) => {
      state.userDeadline = userDeadline;
      state.timestamp = currentTimestamp();
    }),
    updateUserClientSideRouter: create.reducer<{ userClientSideRouter: boolean }>(
      (state, { payload: { userClientSideRouter } }) => {
        state.userClientSideRouter = userClientSideRouter;
      },
    ),
    updateHideClosedPositions: create.reducer<{ userHideClosedPositions: boolean }>(
      (state, { payload: { userHideClosedPositions } }) => {
        state.userHideClosedPositions = userHideClosedPositions;
      },
    ),
    addSerializedToken: create.reducer<{ serializedToken: SerializedToken }>(
      (state, { payload: { serializedToken } }) => {
        if (!state.tokens) {
          state.tokens = {};
        }
        state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {};
        state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken;
        state.timestamp = currentTimestamp();
      },
    ),
    removeSerializedToken: create.reducer<{ address: string; chainId: number }>(
      (state, { payload: { address, chainId } }) => {
        if (!state.tokens) {
          state.tokens = {};
        }
        state.tokens[chainId] = state.tokens[chainId] || {};
        delete state.tokens[chainId][address];
        state.timestamp = currentTimestamp();
      },
    ),
    addSerializedPair: create.reducer<{ serializedPair: SerializedPair }>((state, { payload: { serializedPair } }) => {
      if (
        serializedPair.token0.chainId === serializedPair.token1.chainId &&
        serializedPair.token0.address !== serializedPair.token1.address
      ) {
        const chainId = serializedPair.token0.chainId;
        state.pairs[chainId] = state.pairs[chainId] || {};
        state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair;
      }
      state.timestamp = currentTimestamp();
    }),
    removeSerializedPair: create.reducer<{ chainId: number; tokenAAddress: string; tokenBAddress: string }>(
      (state, { payload: { chainId, tokenAAddress, tokenBAddress } }) => {
        if (state.pairs[chainId]) {
          // just delete both keys if either exists
          delete state.pairs[chainId][pairKey(tokenAAddress, tokenBAddress)];
          delete state.pairs[chainId][pairKey(tokenBAddress, tokenAAddress)];
        }
        state.timestamp = currentTimestamp();
      },
    ),
  }),
});

export const {
  addSerializedPair,
  addSerializedToken,
  removeSerializedPair,
  removeSerializedToken,
  updateArbitrumAlphaAcknowledged,
  updateHideClosedPositions,
  updateMatchesDarkMode,
  updateOptimismAlphaAcknowledged,
  updateUserClientSideRouter,
  updateUserDarkMode,
  updateUserLocale,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserSlippageTolerance,
} = userSlice.actions;

export default userSlice.reducer;
