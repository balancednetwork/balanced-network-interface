import React, { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Wallet, WalletStrategy } from '@injectivelabs/wallet-ts';
import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import { mainnet } from 'wagmi/chains';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';

type InjectiveWalletStore = {
  account: string | undefined;
  ethereumAddress: string | undefined;
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => Promise<void>;
};

export const walletStrategy = new WalletStrategy({
  chainId: ChainId.Testnet,
  // ethereumOptions: {
  //   ethereumChainId: EthereumChainId.Mainnet,
  //   rpcUrl: mainnet.rpcUrls.default.http[0],
  // },
});

export const useInjectiveWalletStore = create<InjectiveWalletStore>()(
  immer((set, get) => ({
    account: undefined,
    ethereumAddress: undefined,
    connect: async (wallet: Wallet) => {
      walletStrategy.setWallet(wallet);
      const addresses = await walletStrategy.getAddresses();

      if (wallet === Wallet.Metamask) {
        const injectiveAddresses = addresses.map(getInjectiveAddress);

        set(state => {
          state.account = injectiveAddresses[0];
          state.ethereumAddress = addresses[0];
        });
      } else {
        set(state => {
          state.account = addresses[0];
          state.ethereumAddress = undefined;
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
);
