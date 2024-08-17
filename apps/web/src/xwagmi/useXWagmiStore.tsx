import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type XServiceStore = {
  xChains: any;
  xConnections: any;
  xConnectors: any;
  //   xPublicClients: any;
  //   xWalletClients: any;
};

export const useXServiceStore = create<XServiceStore>()(
  immer((set, get) => ({
    xChains: {},
    xConnections: {},
    xConnectors: {},
  })),
);
