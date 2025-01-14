import { xChains } from '@/constants/xChains';
import { XChainId, XChainType } from '@/types';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getXChainType } from './actions';
import { XPublicClient, XService, XWalletClient } from './core';
import { useXConnection } from './hooks';
import { XConnection } from './types';
import { jsonStorageOptions } from './utils';
import { ArchwayXConnector, ArchwayXPublicClient, ArchwayXService, ArchwayXWalletClient } from './xchains/archway';
import { EvmXPublicClient, EvmXService, EvmXWalletClient } from './xchains/evm';
import {
  HavahHanaXConnector,
  HavahXConnector,
  HavahXPublicClient,
  HavahXService,
  HavahXWalletClient,
} from './xchains/havah';
import { IconHanaXConnector, IconXPublicClient, IconXService, IconXWalletClient } from './xchains/icon';
import {
  InjectiveKelprXConnector,
  InjectiveMetamaskXConnector,
  InjectiveXPublicClient,
  InjectiveXService,
  InjectiveXWalletClient,
} from './xchains/injective';
import { SolanaXPublicClient, SolanaXWalletClient } from './xchains/solana';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { useAnchorProvider } from './xchains/solana/hooks/useAnchorProvider';
import { StellarXPublicClient, StellarXService, StellarXWalletClient } from './xchains/stellar';
import { SuiXPublicClient, SuiXService, SuiXWalletClient } from './xchains/sui';

const iconXService = IconXService.getInstance();
iconXService.setXConnectors([new IconHanaXConnector()]);

const archwayXService = ArchwayXService.getInstance();
archwayXService.setXConnectors([new ArchwayXConnector()]);

const evmXService = EvmXService.getInstance();
evmXService.setXConnectors([]);

const havahXService = HavahXService.getInstance();
havahXService.setXConnectors([new HavahHanaXConnector(), new HavahXConnector()]);

const injectiveXService = InjectiveXService.getInstance();
injectiveXService.setXConnectors([new InjectiveMetamaskXConnector(), new InjectiveKelprXConnector()]);

const stellarXService = StellarXService.getInstance();
stellarXService.setXConnectors([]);

const suiXService = SuiXService.getInstance();
suiXService.setXConnectors([]);

const solanaXService = SolanaXService.getInstance();
solanaXService.setXConnectors([]);

export const xServices: Record<XChainType, XService> = {
  ICON: iconXService,
  ARCHWAY: archwayXService,
  EVM: evmXService,
  HAVAH: havahXService,
  INJECTIVE: injectiveXService,
  STELLAR: stellarXService,
  SUI: suiXService,
  SOLANA: solanaXService,
};

export const xPublicClients: Partial<Record<XChainId, XPublicClient>> = {};
export const xWalletClients: Partial<Record<XChainId, XWalletClient>> = {};

type XWagmiStore = {
  xServices: Partial<Record<XChainType, XService>>;
  xConnections: Partial<Record<XChainType, XConnection>>;
  xPublicClients: Partial<Record<XChainId, XPublicClient>>;
  xWalletClients: Partial<Record<XChainId, XWalletClient>>;

  setXConnection: (xChainType: XChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: XChainType) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
  persist(
    immer((set, get) => ({
      xServices: {},
      xConnections: {},
      xPublicClients: {},
      xWalletClients: {},
      setXConnection: (xChainType: XChainType, xConnection: XConnection) => {
        set(state => {
          state.xConnections[xChainType] = xConnection;
        });
      },
      unsetXConnection: (xChainType: XChainType) => {
        set(state => {
          delete state.xConnections[xChainType];
        });
      },
    })),
    {
      name: 'xwagmi-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
      partialize: state => ({ xConnections: state.xConnections }),

      // TODO: better way to handle rehydration of xConnections?
      onRehydrateStorage: state => {
        console.log('hydration starts');

        return (state, error) => {
          if (state?.xConnections) {
            console.log('rehydrating xConnections', state.xConnections);
            Object.entries(state.xConnections).forEach(([xChainType, xConnection]) => {
              const xConnector = xServices[xChainType as XChainType].getXConnectorById(xConnection.xConnectorId);
              xConnector?.connect();
            });
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

function createXPublicClient(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);
  switch (xChainType) {
    case 'ICON':
      return new IconXPublicClient(xChainId);
    case 'ARCHWAY':
      return new ArchwayXPublicClient(xChainId);
    case 'EVM':
      return new EvmXPublicClient(xChainId);
    case 'HAVAH':
      return new HavahXPublicClient(xChainId);
    case 'INJECTIVE':
      return new InjectiveXPublicClient(xChainId);
    case 'STELLAR':
      return new StellarXPublicClient(xChainId);
    case 'SUI':
      return new SuiXPublicClient(xChainId);
    case 'SOLANA':
      return new SolanaXPublicClient(xChainId);
    default:
      throw new Error(`Unsupported xChainType: ${xChainType}`);
  }
}

function createXWalletClient(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);
  switch (xChainType) {
    case 'ICON':
      return new IconXWalletClient(xChainId);
    case 'ARCHWAY':
      return new ArchwayXWalletClient(xChainId);
    case 'EVM':
      return new EvmXWalletClient(xChainId);
    case 'HAVAH':
      return new HavahXWalletClient(xChainId);
    case 'INJECTIVE':
      return new InjectiveXWalletClient(xChainId);
    case 'STELLAR':
      return new StellarXWalletClient(xChainId);
    case 'SUI':
      return new SuiXWalletClient(xChainId);
    case 'SOLANA':
      return new SolanaXWalletClient(xChainId);
    default:
      throw new Error(`Unsupported xChainType: ${xChainType}`);
  }
}

export const initXWagmiStore = () => {
  xChains.forEach(xChain => {
    const xChainId = xChain.xChainId;
    if (!xPublicClients[xChainId]) {
      xPublicClients[xChainId] = createXPublicClient(xChainId);
    }
    if (!xWalletClients[xChainId]) {
      xWalletClients[xChainId] = createXWalletClient(xChainId);
    }
  });

  useXWagmiStore.setState({
    xServices,
    xPublicClients,
    xWalletClients,
  });

  archwayXService.init();
};

export const useInitXWagmiStore = () => {
  const suiClient = useSuiClient();
  useEffect(() => {
    if (suiClient) {
      suiXService.suiClient = suiClient;
    }
  }, [suiClient]);
  const { currentWallet: suiWallet } = useCurrentWallet();
  useEffect(() => {
    if (suiWallet) {
      suiXService.suiWallet = suiWallet;
    }
  }, [suiWallet]);
  const suiAccount = useCurrentAccount();
  useEffect(() => {
    if (suiAccount) {
      suiXService.suiAccount = suiAccount;
    }
  }, [suiAccount]);

  const { connection: solanaConnection } = useConnection();
  const solanaWallet = useWallet();
  const solanaProvider = useAnchorProvider();
  useEffect(() => {
    if (solanaConnection) {
      solanaXService.connection = solanaConnection;
    }
  }, [solanaConnection]);
  useEffect(() => {
    if (solanaWallet) {
      solanaXService.wallet = solanaWallet;
    }
  }, [solanaWallet]);
  useEffect(() => {
    if (solanaProvider) {
      solanaXService.provider = solanaProvider;
    }
  }, [solanaProvider]);

  const havahXConnection = useXConnection('HAVAH');
  useEffect(() => {
    if (havahXConnection) {
      if (havahXConnection.xConnectorId === 'hana') {
        // @ts-ignore
        havahXService.walletClient = new BalancedJs({ networkId: 0x100, walletProvider: window.hanaWallet.havah });
      } else if (havahXConnection.xConnectorId === 'havah') {
        // @ts-ignore
        havahXService.walletClient = new BalancedJs({ networkId: 0x100, walletProvider: window.havah });
      }
    }
  }, [havahXConnection]);
};
