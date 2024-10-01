import { CurrencyAmount, XChainType, XToken } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

/**
 * A map where the key is a string representing the address and the value is a CurrencyAmount of XToken.
 */
export type TokenAmountMap = { [tokenAddress: string]: CurrencyAmount<XToken> };

/**
 * A map where the key is a string representing the account and the value is a CurrencyAmountMap.
 */
export type AccountTokenAmountMap = { [account: string]: TokenAmountMap };

type XChainTypeToAccountMap = { [key in XChainType]?: string };

export type WalletState = {
  accounts: XChainTypeToAccountMap;
  balances: AccountTokenAmountMap;
};

const initialState: WalletState = {
  accounts: {},
  balances: {},
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: create => ({
    changeBalances: create.reducer<{ xChainType: XChainType; account: string | undefined; balances: TokenAmountMap }>(
      (state, { payload }) => {
        const { xChainType, account, balances } = payload;

        if (account) {
          state.accounts[xChainType] = account;
          for (const tokenAddress in balances) {
            const balance = balances[tokenAddress];
            if (!state.balances[account]) state.balances[account] = {};
            state.balances[account][tokenAddress] = balance;
          }
        } else {
          const _account = state.accounts[xChainType];
          if (!_account) return;
          state.balances[_account] = {};
          state.accounts[xChainType] = undefined;
        }
      },
    ),
    resetBalances: create.reducer<void>(state => {
      return initialState;
    }),
  }),
});

export const { resetBalances, changeBalances } = walletSlice.actions;

export default walletSlice.reducer;
