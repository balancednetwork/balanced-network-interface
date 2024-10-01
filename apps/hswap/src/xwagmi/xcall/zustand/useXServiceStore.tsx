import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { useXPublicClient } from '@/xwagmi/hooks';
import { XChain } from '@/xwagmi/types';
import { XChainId } from '@balancednetwork/sdk-core';

type XServiceStore = {
  xChainHeights: Partial<Record<XChainId, bigint>>;
  getXChainHeight: (xChainId: XChainId) => bigint;
  setXChainHeight: (xChainId: XChainId, height: bigint) => void;
};

export const useXServiceStore = create<XServiceStore>()(
  immer((set, get) => ({
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
  })),
);

export const xServiceActions = {
  getXChainHeight: (xChainId: XChainId) => {
    return useXServiceStore.getState().getXChainHeight(xChainId);
  },
  setXChainHeight: (xChainId: XChainId, height: bigint) => {
    return useXServiceStore.getState().setXChainHeight(xChainId, height);
  },
};

const XChainHeightUpdater = ({ xChainId }: { xChainId: XChainId }) => {
  const xPublicClient = useXPublicClient(xChainId);

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
        // console.log(e);
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
