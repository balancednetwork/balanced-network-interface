import { XChainType } from '@balancednetwork/sdk-core';
import { useWallets } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { useConnectors } from 'wagmi';
import { XConnector } from '../core';
import { EvmXConnector } from '../xchains/evm';
import { SuiXConnector } from '../xchains/sui';
import { useXService } from './useXService';

export function useXConnectors(xChainType: XChainType | undefined): XConnector[] {
  const xService = useXService(xChainType);
  const evmConnectors = useConnectors();
  const suiWallets = useWallets();

  const xConnectors = useMemo((): XConnector[] => {
    if (!xChainType || !xService) {
      return [];
    }

    switch (xChainType) {
      case 'EVM':
        return evmConnectors.map(connector => new EvmXConnector(connector));
      case 'SUI':
        return suiWallets.map(wallet => new SuiXConnector(wallet));
      default:
        return xService.getXConnectors();
    }
  }, [xService, xChainType, evmConnectors, suiWallets]);

  return xConnectors;
}
