import axios from 'axios';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { XChain, XChainId } from '@/xwagmi/types';
import { createJSONStorage, persist } from 'zustand/middleware';

type XChainHeightStore = {
  xChainHeights: Partial<Record<XChainId, bigint>>;
  getXChainHeight: (xChainId: XChainId) => bigint;
  setXChainHeight: (xChainId: XChainId, height: bigint) => void;
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

export const useXChainHeightStore = create<XChainHeightStore>()(
  persist(
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
    {
      name: 'xChainHeight-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
    },
  ),
);

export const xChainHeightActions = {
  getXChainHeight: (xChainId: XChainId) => {
    return useXChainHeightStore.getState().getXChainHeight(xChainId);
  },
  setXChainHeight: (xChainId: XChainId, height: bigint) => {
    return useXChainHeightStore.getState().setXChainHeight(xChainId, height);
  },
};

const xChainIdMap: Record<XChainId, string> = {
  'archway-1': 'ibc_archway',
  archway: 'ibc_archway',
  '0x1.icon': 'icon',
  '0x2.icon': 'icon',
  '0x100.icon': 'havah',
  '0xa86a.avax': 'avax',
  '0xa869.fuji': 'avax',
  '0x38.bsc': 'bsc',
  '0xa4b1.arbitrum': 'arbitrum',
  '0x2105.base': 'base',
  'injective-1': 'ibc_injective',
  sui: 'sui',
  stellar: 'stellar',
  solana: 'solana',
};

export const AllXChainHeightsUpdater = ({ xChains }: { xChains: XChain[] }) => {
  const { data: _xChainHeights } = useQuery({
    queryKey: ['xChainHeights'],
    queryFn: async () => {
      const apiUrl = `https://xcallscan.xyz/api/rpc/block_height`;
      try {
        const res = await axios.get(apiUrl);
        if (res.data && res.data.length > 0 && res.status === 200) {
          return res.data;
        }
      } catch (e) {
        console.log(e);
      }
      return null;
    },
    refetchInterval: 1500,
  });

  useEffect(() => {
    if (_xChainHeights) {
      xChains.forEach(({ xChainId }) => {
        try {
          const height = BigInt(_xChainHeights.find(x => x.network === xChainIdMap[xChainId]).block_height);
          if (height > xChainHeightActions.getXChainHeight(xChainId)) {
            xChainHeightActions.setXChainHeight(xChainId, BigInt(height));
          }
        } catch (e) {
          console.log(e);
        }
      });
    }
  }, [_xChainHeights, xChains]);

  return null;
};
