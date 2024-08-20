import React, { useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useWalletClient } from 'wagmi';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { havahJs } from '@/bnJs';
import { xChainMap } from '@/constants/xChains';
import { useArchwayContext } from '@/packages/archway/ArchwayProvider';
import { useIconReact } from '@/packages/icon-react';
import { useChangeShouldLedgerSign } from '@/store/application/hooks';
import { XChain, XChainId } from '@/types';
import { ArchwayXPublicClient } from '../_xcall/ArchwayXPublicClient';
import { ArchwayXWalletClient } from '../_xcall/ArchwayXWalletClient';
import { EvmXPublicClient } from '../_xcall/EvmXPublicClient';
import { EvmXWalletClient } from '../_xcall/EvmXWalletClient';
import { HavahXPublicClient } from '../_xcall/HavahXPublicClient';
import { HavahXWalletClient } from '../_xcall/HavahXWalletClient';
import { IconXPublicClient } from '../_xcall/IconXPublicClient';
import { IconXWalletClient } from '../_xcall/IconXWalletClient';
import { InjectiveXPublicClient } from '../_xcall/InjectiveXPublicClient';
import { InjectiveXWalletClient } from '../_xcall/InjectiveXWalletClient';
import { XPublicClient, XWalletClient } from '../_xcall/types';

type XServiceStore = {
  xPublicClients: Partial<Record<XChainId, XPublicClient>>;
  xWalletClients: Partial<Record<XChainId, XWalletClient>>;
  xChainHeights: Partial<Record<XChainId, bigint>>;
  getXPublicClient: (xChainId: XChainId) => XPublicClient;
  setXPublicClient: (xChainId: XChainId, xPublicClient: XPublicClient) => void;
  getXWalletClient: (xChainId: XChainId) => XWalletClient | undefined;
  setXWalletClient: (xChainId: XChainId, xWalletClient: XWalletClient) => void;
  getXChainHeight: (xChainId: XChainId) => bigint;
  setXChainHeight: (xChainId: XChainId, height: bigint) => void;
};

export const useXServiceStore = create<XServiceStore>()(
  immer((set, get) => ({
    xPublicClients: {},
    xWalletClients: {},
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
    getXPublicClient: (xChainId: XChainId) => {
      return get().xPublicClients[xChainId];
    },
    setXPublicClient: (xChainId: XChainId, xPublicClient: XPublicClient) => {
      set(state => {
        state.xPublicClients[xChainId] = xPublicClient;
      });
    },

    getXWalletClient: (xChainId: XChainId) => {
      return get().xWalletClients[xChainId];
    },
    setXWalletClient: (xChainId: XChainId, xWalletClient: XWalletClient) => {
      set(state => {
        state.xWalletClients[xChainId] = xWalletClient;
      });
    },
  })),
);

export const xServiceActions = {
  getXPublicClient: (xChainId: XChainId) => {
    return useXServiceStore.getState().getXPublicClient(xChainId);
  },
  setXPublicClient: (xChainId: XChainId, xPublicClient: XPublicClient) => {
    return useXServiceStore.getState().setXPublicClient(xChainId, xPublicClient);
  },
  getXWalletClient: (xChainId: XChainId) => {
    return useXServiceStore.getState().getXWalletClient(xChainId);
  },
  setXWalletClient: (xChainId: XChainId, xWalletClient: XWalletClient) => {
    return useXServiceStore.getState().setXWalletClient(xChainId, xWalletClient);
  },
  getXChainHeight: (xChainId: XChainId) => {
    return useXServiceStore.getState().getXChainHeight(xChainId);
  },
  setXChainHeight: (xChainId: XChainId, height: bigint) => {
    return useXServiceStore.getState().setXChainHeight(xChainId, height);
  },
};

const createPublicXService = (PublicXServiceClass, xChainId: XChainId, publicClient: any) => {
  const xPublicClient = new PublicXServiceClass(xChainId, publicClient);
  xServiceActions.setXPublicClient(xChainId, xPublicClient);
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
          createPublicXService(IconXPublicClient, xChainId, iconPublicClient);
          break;
        case 'ARCHWAY':
          if (archwayPublicClient) {
            createPublicXService(ArchwayXPublicClient, xChainId, archwayPublicClient);
          }
          break;
        case 'EVM':
          createPublicXService(EvmXPublicClient, xChainId, evmPublicClient);
          break;
        case 'HAVAH':
          createPublicXService(HavahXPublicClient, xChainId, havahJs.provider);
          break;
        case 'INJECTIVE':
          createPublicXService(InjectiveXPublicClient, xChainId, undefined);
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
  const xWalletClient = new WalletXServiceClass(xChainId, publicClient, walletClient, options);
  xServiceActions.setXWalletClient(xChainId, xWalletClient);
};

export const useCreateWalletXService = (xChainId: XChainId) => {
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const xPublicClient = useXServiceStore(state => state.xPublicClients?.[xChainId]);

  const { iconService: iconWalletClient } = useIconReact();
  const { signingClient: archwayWalletClient } = useArchwayContext();
  const { data: evmWalletClient } = useWalletClient();

  useEffect(() => {
    const setupWalletXService = (xChainId: XChainId) => {
      const publicClient = xPublicClient?.getPublicClient();

      const xChainType = xChainId ? xChainMap[xChainId].xChainType : undefined;
      switch (xChainType) {
        case 'ICON':
          createWalletXService(IconXWalletClient, xChainId, publicClient, iconWalletClient, {
            changeShouldLedgerSign,
          });
          break;
        case 'ARCHWAY':
          createWalletXService(ArchwayXWalletClient, xChainId, publicClient, archwayWalletClient);
          break;
        case 'EVM':
          createWalletXService(EvmXWalletClient, xChainId, publicClient, evmWalletClient);
          break;
        case 'HAVAH':
          createWalletXService(HavahXWalletClient, xChainId, publicClient, havahJs.provider);
          break;
        case 'INJECTIVE':
          createWalletXService(InjectiveXWalletClient, xChainId, undefined, undefined);
          break;
        default:
          break;
      }
    };

    if (xPublicClient) {
      setupWalletXService(xChainId);
    }
  }, [xChainId, iconWalletClient, archwayWalletClient, evmWalletClient, xPublicClient, changeShouldLedgerSign]);

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
  const xPublicClient = useXServiceStore(state => state.xPublicClients?.[xChainId]);

  useQuery({
    queryKey: ['xChainHeight', xChainId, xPublicClient],
    queryFn: async () => {
      if (!xPublicClient) return 0n;

      try {
        const blockHeight = await xPublicClient.getBlockHeight();
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
    enabled: Boolean(xPublicClient),
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
