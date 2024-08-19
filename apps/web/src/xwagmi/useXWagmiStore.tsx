import { XChainType } from '@/types';
import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { XConnection } from './core/types';
import { ArchwayXConnector } from './xchains/archway/ArchwayXConnector';
import { ArchwayXService } from './xchains/archway/ArchwayXService';
import { EvmXService } from './xchains/evm/EvmXService';
import { HavahXConnector } from './xchains/havah/HavahXConnector';
import { HavahXService } from './xchains/havah/HavahXService';
import { IconHanaXConnector } from './xchains/icon/IconHanaXConnector';
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

const iconXService = IconXService.getInstance();
iconXService.setXConnectors([new IconHanaXConnector(iconXService)]);

const archwayXService = ArchwayXService.getInstance();
archwayXService.setXConnectors([new ArchwayXConnector(archwayXService)]);

const evmXService = EvmXService.getInstance();
evmXService.setXConnectors([]);

const havahXService = HavahXService.getInstance();
havahXService.setXConnectors([new HavahXConnector(havahXService)]);

export const initXWagmiStore = () => {
  useXWagmiStore.setState({
    xServices: {
      ICON: iconXService,
      ARCHWAY: archwayXService,
      EVM: evmXService,
      HAVAH: havahXService,
    },
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
