import { XChainId, XChainType } from '@/types';

const xChainIdTypeMap: Record<XChainId, XChainType> = {
  'archway-1': 'ARCHWAY',
  archway: 'ARCHWAY',
  '0x1.icon': 'ICON',
  '0x2.icon': 'ICON',
  '0xa86a.avax': 'EVM',
  '0xa869.fuji': 'EVM',
  '0x100.icon': 'HAVAH',
  '0x38.bsc': 'EVM',
  '0xa4b1.arbitrum': 'EVM',
  '0x2105.base': 'EVM',
};

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainIdTypeMap[xChainId];
}
