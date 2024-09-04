import { useMemo } from 'react';
import { useConnectors } from 'wagmi';
import { XConnector } from '../core';
import { XChainType } from '../types';
import { EvmXConnector } from '../xchains/evm';
import { useXService } from './useXService';

export function useXConnectors(xChainType: XChainType | undefined): XConnector[] {
  const xService = useXService(xChainType);
  const evmConnectors = useConnectors();

  const xConnectors = useMemo((): XConnector[] => {
    if (!xChainType || !xService) {
      return [];
    }

    switch (xChainType) {
      case 'EVM':
        return evmConnectors.map(connector => new EvmXConnector(connector));
      default:
        return xService.getXConnectors();
    }
  }, [xService, xChainType, evmConnectors]);

  return xConnectors;
}
