import React, { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Wallet, WalletStrategy } from '@injectivelabs/wallet-ts';
import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import { mainnet } from 'wagmi/chains';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';

type InjectiveWalletStore = {
  account: string | undefined;
  ethereumAddress: string | undefined;
  wallet: Wallet | undefined;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
};

export const walletStrategy = new WalletStrategy({
  chainId: ChainId.Mainnet,
  ethereumOptions: {
    ethereumChainId: EthereumChainId.Mainnet,
    rpcUrl: mainnet.rpcUrls.default.http[0],
  },
});

export const useInjectiveWalletStore = create<InjectiveWalletStore>()(
  persist(
    immer((set, get) => ({
      account: undefined,
      ethereumAddress: undefined,
      wallet: undefined,
      connect: async (wallet: Wallet) => {
        walletStrategy.setWallet(wallet);
        const addresses = await walletStrategy.getAddresses();

        if (wallet === Wallet.Metamask) {
          const injectiveAddresses = addresses.map(getInjectiveAddress);

          set(state => {
            state.account = injectiveAddresses[0];
            state.ethereumAddress = addresses[0];
            state.wallet = wallet;
          });
        } else {
          set(state => {
            state.account = addresses[0];
            state.ethereumAddress = undefined;
            state.wallet = wallet;
          });
        }
      },
      disconnect: async () => {
        set(state => {
          state.account = undefined;
          state.ethereumAddress = undefined;
        });
        await walletStrategy.disconnect();
      },
    })),
    {
      name: 'injective-wallet-store',
      storage: createJSONStorage(() => localStorage),
      // onRehydrateStorage: state => {
      //   console.log('hydration starts');
      //   console.log('state', state);
      //   if (state.wallet) {
      //     // walletStrategy.setWallet(state.wallet);
      //     console.log('state.wallet', state.wallet);
      //     useInjectiveWalletStore.getState().connect(state.wallet);
      //   }

      //   // optional
      //   return (state, error) => {
      //     if (error) {
      //       console.log('an error happened during hydration', error);
      //     } else {
      //       console.log('hydration finished');
      //     }
      //   };
      // },
    },
  ),
);

export const useInjectiveWallet = () => {
  const { account, connect, disconnect } = useInjectiveWalletStore();

  return {
    account,
    connect,
    disconnect,
  };
};
