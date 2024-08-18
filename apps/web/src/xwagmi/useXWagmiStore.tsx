import { XChainType } from '@/types';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { XConnector } from './core/XConnector';
import { XConnection } from './core/types';
import { EvmXService } from './xchains/evm/EvmXService';
import { HavahXService } from './xchains/havah/HavahXService';
import { IconXService } from './xchains/icon/IconXService';

type XWagmiStore = {
  xServices: Partial<Record<XChainType, any>>;
  xConnections: any;
  //   xPublicClients: any;
  //   xWalletClients: any;

  setXConnection: (xChainType: XChainType, xConnection: XConnection) => void;
  unsetXConnection: (xChainType: XChainType) => void;
};

export const useXWagmiStore = create<XWagmiStore>()(
  immer((set, get) => ({
    xServices: {},
    xConnections: {},
    //     xPublicClients: {},
    //     xWalletClients: {},
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

export const initXWagmiStore = () => {
  useXWagmiStore.setState({
    xServices: {
      ICON: new IconXService(),
      EVM: new EvmXService(),
      HAVAH: new HavahXService(),
    },
  });
};
