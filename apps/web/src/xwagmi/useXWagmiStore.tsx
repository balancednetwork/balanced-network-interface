import { xChains } from '@/constants/xChains';
import { XChainId, XChainType } from '@/types';
import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getXChainType } from './actions';
import { XPublicClient, XService, XWalletClient } from './core';
import { XConnection } from './core/types';
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

type XWagmiStore = {
  xServices: Partial<Record<XChainType, XService>>;
  xConnections: any;
  xPublicClients: any;
  xWalletClients: any;

  setXConnection: (xChainType: XChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: XChainType) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
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
);

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

export const xServices = {
  ICON: iconXService,
  ARCHWAY: archwayXService,
  EVM: evmXService,
  HAVAH: havahXService,
  INJECTIVE: injectiveXService,
};

export const xPublicClients: Partial<Record<XChainId, XPublicClient>> = {};
export const xWalletClients: Partial<Record<XChainId, XWalletClient>> = {};

function createXPublicClient(xChainId) {
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

function createXWalletClient(xChainId) {
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
//   const setXConnection = useXWagmiStore(state => state.setXConnection);
//   const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

//   useEffect(() => {
//     initXWagmiStore();
//   }, []);

//   return {
//     setXConnection,
//     unsetXConnection,
//   };
// };
