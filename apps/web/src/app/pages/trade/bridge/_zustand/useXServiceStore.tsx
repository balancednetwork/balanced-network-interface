import React, { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useQuery } from '@tanstack/react-query';

import { usePublicClient, useWalletClient } from 'wagmi';

import { useIconReact } from '@/packages/icon-react';
import { useArchwayContext } from '@/packages/archway/ArchwayProvider';
import { useChangeShouldLedgerSign } from '@/store/application/hooks';

import { xChainMap } from '@/constants/xChains';
import { XChainId, XChain } from '@/types';
import { IPublicXService, IWalletXService } from '../_xcall/types';
import { IconPublicXService } from '../_xcall/IconPublicXService';
import { ArchwayPublicXService } from '../_xcall/ArchwayPublicXService';
import { EvmPublicXService } from '../_xcall/EvmPublicXService';
import { IconWalletXService } from '../_xcall/IconWalletXService';
import { ArchwayWalletXService } from '../_xcall/ArchwayWalletXService';
import { EvmWalletXService } from '../_xcall/EvmWalletXService';
import { havahJs } from '@/bnJs';
import { HavahPublicXService } from '../_xcall/HavahPublicXService';
import { HavahWalletXService } from '../_xcall/HavahWalletXService';

type XServiceStore = {
  publicXServices: Partial<Record<XChainId, IPublicXService>>;
  walletXServices: Partial<Record<XChainId, IWalletXService>>;
  xChainHeights: Partial<Record<XChainId, bigint>>;
  getPublicXService: (xChainId: XChainId) => IPublicXService;
  setPublicXService: (xChainId: XChainId, publicXService: IPublicXService) => void;
  getWalletXService: (xChainId: XChainId) => IWalletXService | undefined;
  setWalletXService: (xChainId: XChainId, walletXService: IWalletXService) => void;
  getXChainHeight: (xChainId: XChainId) => bigint;
  setXChainHeight: (xChainId: XChainId, height: bigint) => void;
};

export const useXServiceStore = create<XServiceStore>()(
  immer((set, get) => ({
    publicXServices: {},
    walletXServices: {},
    xChainHeights: {},

    getXChainHeight: (xChainId: XChainId) => {
      const height = get().xChainHeights?.[xChainId];
      return height ? BigInt(height) : BigInt(0);
    },
    setXChainHeight: (xChainId: XChainId, height: bigint) => {
      set(state => {
        state.xChainHeights[xChainId] = height;
      });
    },

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
  getXChainHeight: (xChainId: XChainId) => {
    return useXServiceStore.getState().getXChainHeight(xChainId);
  },
  setXChainHeight: (xChainId: XChainId, height: bigint) => {
    return useXServiceStore.getState().setXChainHeight(xChainId, height);
  },
};

const createPublicXService = (PublicXServiceClass, xChainId: XChainId, publicClient: any) => {
  const publicXService = new PublicXServiceClass(xChainId, publicClient);
  xServiceActions.setPublicXService(xChainId, publicXService);
};

export const useCreatePublicXService = (xChainId: XChainId) => {
  const { iconService: iconPublicClient } = useIconReact();
  const { client: archwayPublicClient } = useArchwayContext();

  const chainId = useMemo(() => {
    const xChain = xChainMap[xChainId];
    if (xChain.xChainType === 'EVM') {
      return xChain.id;
    }
  }, [xChainId]);

  // @ts-ignore, xChain.id is always number for EVM
  const evmPublicClient = usePublicClient({ chainId });

  useEffect(() => {
    const setupPublicXService = (xChainId: XChainId) => {
      const xChainType = xChainId ? xChainMap[xChainId].xChainType : undefined;
      switch (xChainType) {
        case 'ICON':
          createPublicXService(IconPublicXService, xChainId, iconPublicClient);
          break;
        case 'ARCHWAY':
          createPublicXService(ArchwayPublicXService, xChainId, archwayPublicClient);
          break;
        case 'EVM':
          createPublicXService(EvmPublicXService, xChainId, evmPublicClient);
          break;
        case 'HAVAH':
          createPublicXService(HavahPublicXService, xChainId, havahJs.provider);
          break;
        default:
          break;
      }
    };

    setupPublicXService(xChainId);
  }, [xChainId, iconPublicClient, archwayPublicClient, evmPublicClient]);

  return true;
};

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

export const useCreateWalletXService = (xChainId: XChainId) => {
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const publicXService = useXServiceStore(state => state.publicXServices?.[xChainId]);

  const { iconService: iconWalletClient } = useIconReact();
  const { signingClient: archwayWalletClient } = useArchwayContext();
  const { data: evmWalletClient } = useWalletClient();

  useEffect(() => {
    const setupWalletXService = (xChainId: XChainId) => {
      const publicClient = publicXService?.getPublicClient();

      const xChainType = xChainId ? xChainMap[xChainId].xChainType : undefined;
      switch (xChainType) {
        case 'ICON':
          createWalletXService(IconWalletXService, xChainId, publicClient, iconWalletClient, {
            changeShouldLedgerSign,
          });
          break;
        case 'ARCHWAY':
          createWalletXService(ArchwayWalletXService, xChainId, publicClient, archwayWalletClient);
          break;
        case 'EVM':
          createWalletXService(EvmWalletXService, xChainId, publicClient, evmWalletClient);
          break;
        case 'HAVAH':
          createWalletXService(HavahWalletXService, xChainId, publicClient, havahJs.provider);
          break;
        default:
          break;
      }
    };

    if (publicXService) {
      setupWalletXService(xChainId);
    }
  }, [xChainId, iconWalletClient, archwayWalletClient, evmWalletClient, publicXService, changeShouldLedgerSign]);

  return true;
};

export const PublicXServiceCreator = ({ xChainId }: { xChainId: XChainId }) => {
  useCreatePublicXService(xChainId);
  return null;
};

export const AllPublicXServicesCreator = ({ xChains }: { xChains: XChain[] }) => {
  return (
    <>
      {xChains.map(xChain => (
        <PublicXServiceCreator key={xChain.xChainId} xChainId={xChain.xChainId} />
      ))}
    </>
  );
};

export const XChainHeightUpdater = ({ xChainId }: { xChainId: XChainId }) => {
  const publicXService = useXServiceStore(state => state.publicXServices?.[xChainId]);

  useQuery({
    queryKey: ['xChainHeight', xChainId, publicXService],
    queryFn: async () => {
      if (!publicXService) return 0n;

      try {
        const blockHeight = await publicXService.getBlockHeight();
        if (blockHeight) {
          xServiceActions.setXChainHeight(xChainId, blockHeight);
        }
        return blockHeight;
      } catch (e) {
        console.log(e);
        return 0n;
      }
    },
    refetchInterval: 1000,
    enabled: Boolean(publicXService),
    placeholderData: prev => prev,
  });

  return null;
};

export const AllXChainHeightsUpdater = ({ xChains }: { xChains: XChain[] }) => {
  return (
    <>
      {xChains.map(xChain => (
        <XChainHeightUpdater key={xChain.xChainId} xChainId={xChain.xChainId} />
      ))}
    </>
  );
};
