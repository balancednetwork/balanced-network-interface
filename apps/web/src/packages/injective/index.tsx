import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import { Wallet, WalletStrategy } from '@injectivelabs/wallet-ts';
import { mainnet } from 'wagmi/chains';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
          state.wallet = undefined;
        });
        await walletStrategy.disconnect();
      },
    })),
    {
      name: 'injective-wallet-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: state => {
        console.log('hydration starts');

        // optional
        return (state, error) => {
          if (state?.wallet) {
            state.connect(state.wallet);
            // walletStrategy.setWallet(state.wallet);
          }
          if (error) {
            console.log('an error happened during hydration', error);
          } else {
            console.log('hydration finished');
          }
        };
      },
    },
  ),
);

export const useInjectiveWallet = () => {
  const { account, wallet, connect, disconnect } = useInjectiveWalletStore();

  return {
    account,
    wallet,
    connect,
    disconnect,
  };
};

export const switchEthereumChain = async chainId => {
  const metamaskProvider = (window as any).ethereum as any;

  await Promise.race([
    metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId}` }],
    }),
    new Promise<void>(resolve =>
      metamaskProvider.on('change', ({ chain }: any) => {
        if (chain?.id === chainId) {
          resolve();
        }
      }),
    ),
  ]);
};
