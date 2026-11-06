import { useEffect } from 'react';

import { XChainId } from '@balancednetwork/sdk-core';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { XChain } from '@/types';
import { getXPublicClient } from '@/actions/getXPublicClient';
import { readChainHeights } from '../utils/chainHeights';

type XChainHeightStore = {
  xChainHeights: Partial<Record<XChainId, bigint>>;
  getXChainHeight: (xChainId: XChainId) => bigint;
  setXChainHeight: (xChainId: XChainId, height: bigint) => void;
};

export const useXChainHeightStore = create<XChainHeightStore>()(
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

export const xChainHeightActions = {
  getXChainHeight: (xChainId: XChainId) => {
    return useXChainHeightStore.getState().getXChainHeight(xChainId);
  },
  setXChainHeight: (xChainId: XChainId, height: bigint) => {
    return useXChainHeightStore.getState().setXChainHeight(xChainId, height);
  },
};

export const AllXChainHeightsUpdater = ({ xChains }: { xChains: XChain[] }) => {
  const chainIds = xChains.map(chain => chain.xChainId);
  const { data: heights } = useQuery({
    queryKey: ['xChainHeights', chainIds],
    queryFn: () => readChainHeights(chainIds, getXPublicClient),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    if (!heights) return;
    Object.entries(heights).forEach(([chainId, height]) => {
      const xChainId = chainId as XChainId;
      if (height !== undefined && height > xChainHeightActions.getXChainHeight(xChainId)) {
        xChainHeightActions.setXChainHeight(xChainId, height);
      }
    });
  }, [heights]);

  return null;
};
