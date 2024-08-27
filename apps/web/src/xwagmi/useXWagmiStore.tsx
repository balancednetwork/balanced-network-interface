import { xChains } from '@/constants/xChains';
import { XChainId, XChainType } from '@/xwagmi/types';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getXChainType } from './actions';
import { XPublicClient, XService, XWalletClient } from './core';
import { XConnection } from './types';
import { ArchwayXConnector, ArchwayXPublicClient, ArchwayXService, ArchwayXWalletClient } from './xchains/archway';
import { EvmXPublicClient, EvmXService, EvmXWalletClient } from './xchains/evm';
import { HavahXConnector, HavahXPublicClient, HavahXService, HavahXWalletClient } from './xchains/havah';
import { IconHanaXConnector, IconXPublicClient, IconXService, IconXWalletClient } from './xchains/icon';
import {
  InjectiveKelprXConnector,
  InjectiveMetamaskXConnector,
  InjectiveXPublicClient,
  InjectiveXService,
  InjectiveXWalletClient,
} from './xchains/injective';

const iconXService = IconXService.getInstance();
iconXService.setXConnectors([new IconHanaXConnector()]);

const archwayXService = ArchwayXService.getInstance();
archwayXService.setXConnectors([new ArchwayXConnector()]);

const evmXService = EvmXService.getInstance();
evmXService.setXConnectors([]);

const havahXService = HavahXService.getInstance();
havahXService.setXConnectors([new HavahXConnector()]);

const injectiveXService = InjectiveXService.getInstance();
injectiveXService.setXConnectors([new InjectiveMetamaskXConnector(), new InjectiveKelprXConnector()]);

export const xServices: Record<XChainType, XService> = {
  ICON: iconXService,
  ARCHWAY: archwayXService,
  EVM: evmXService,
  HAVAH: havahXService,
  INJECTIVE: injectiveXService,
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

const jsonStorageOptions = {
  reviver: (key, value: any) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else {
      return value;
    }
  },
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

// export const useInitXWagmiStore = () => {
//   useEffect(() => {
//     initXWagmiStore();
//   }, []);
// };
