import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { usePublicClient, useWalletClient } from 'wagmi';
import { useIconReact } from 'packages/icon-react';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useChangeShouldLedgerSign } from 'store/application/hooks';

import { XChainId } from 'app/pages/trade/bridge/types';
import { IPublicXService, IWalletXService } from '../_xcall/types';
import { IconPublicXService } from '../_xcall/IconPublicXService';
import { ArchwayPublicXService } from '../_xcall/ArchwayPublicXService';
import { EvmPublicXService } from '../_xcall/EvmPublicXService';
import { IconWalletXService } from '../_xcall/IconWalletXService';
import { ArchwayWalletXService } from '../_xcall/ArchwayWalletXService';
import { EvmWalletXService } from '../_xcall/EvmWalletXService';

type XServiceStore = {
  publicXServices: Partial<Record<XChainId, IPublicXService>>;
  walletXServices: Partial<Record<XChainId, IWalletXService>>;
  getPublicXService: (xChainId: XChainId) => IPublicXService;
  setPublicXService: (xChainId: XChainId, publicXService: IPublicXService) => void;
  getWalletXService: (xChainId: XChainId) => IWalletXService | undefined;
  setWalletXService: (xChainId: XChainId, walletXService: IWalletXService) => void;
};

export const useXServiceStore = create<XServiceStore>()(
  immer((set, get) => ({
    publicXServices: {},
    walletXServices: {},

    // @ts-ignore
    getPublicXService: (xChainId: XChainId) => {
      return get().publicXServices[xChainId];
    },
    setPublicXService: (xChainId: XChainId, publicXService: IPublicXService) => {
      set(state => {
        state.publicXServices[xChainId] = publicXService;
      });
    },

    getWalletXService: (xChainId: XChainId) => {
      return get().walletXServices[xChainId];
    },
    setWalletXService: (xChainId: XChainId, walletXService: IWalletXService) => {
      set(state => {
        state.walletXServices[xChainId] = walletXService;
      });
    },
  })),
);

export const xServiceActions = {
  getPublicXService: (xChainId: XChainId) => {
    return useXServiceStore.getState().getPublicXService(xChainId);
  },
  setPublicXService: (xChainId: XChainId, publicXService: IPublicXService) => {
    return useXServiceStore.getState().setPublicXService(xChainId, publicXService);
  },
  getWalletXService: (xChainId: XChainId) => {
    return useXServiceStore.getState().getWalletXService(xChainId);
  },
  setWalletXService: (xChainId: XChainId, walletXService: IWalletXService) => {
    return useXServiceStore.getState().setWalletXService(xChainId, walletXService);
  },
};

export const useCreatePublicXService = (xChainId: XChainId) => {
  const { iconService } = useIconReact();
  const { client } = useArchwayContext();
  const publicClient = usePublicClient();

  const createPublicXService = (PublicXServiceClass, xChainId: XChainId, publicClient: any) => {
    const publicXService = new PublicXServiceClass(xChainId, publicClient);
    xServiceActions.setPublicXService(xChainId, publicXService);
  };

  useEffect(() => {
    const setupPublicXService = (xChainId: XChainId) => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        createPublicXService(IconPublicXService, xChainId, iconService);
      } else if (xChainId === 'archway-1' || xChainId === 'archway') {
        createPublicXService(ArchwayPublicXService, xChainId, client);
      } else if (xChainId === '0xa86a.avax' || xChainId === '0xa869.fuji') {
        createPublicXService(EvmPublicXService, xChainId, publicClient);
      }
    };

    setupPublicXService(xChainId);
  }, [xChainId, client, iconService, publicClient, createPublicXService]);

  return true;
};

export const useCreateWalletXService = (xChainId: XChainId) => {
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const { iconService } = useIconReact();
  const { client, signingClient } = useArchwayContext();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const createWalletXService = (
    WalletXServiceClass,
    xChainId: XChainId,
    publicClient: any,
    walletClient: any,
    options?: any,
  ) => {
    const walletXService = new WalletXServiceClass(xChainId, publicClient, walletClient, options);
    xServiceActions.setWalletXService(xChainId, walletXService);
  };

  useEffect(() => {
    const setupWalletXService = (xChainId: XChainId) => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        createWalletXService(IconWalletXService, xChainId, iconService, iconService, { changeShouldLedgerSign });
      } else if (xChainId === 'archway-1' || xChainId === 'archway') {
        createWalletXService(ArchwayWalletXService, xChainId, client, signingClient);
      } else if (xChainId === '0xa86a.avax' || xChainId === '0xa869.fuji') {
        createWalletXService(EvmWalletXService, xChainId, publicClient, walletClient);
      }
    };

    setupWalletXService(xChainId);
  }, [
    xChainId,
    client,
    signingClient,
    iconService,
    publicClient,
    walletClient,
    createWalletXService,
    changeShouldLedgerSign,
  ]);

  return true;
};
