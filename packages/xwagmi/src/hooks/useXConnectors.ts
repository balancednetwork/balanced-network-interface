import { useWallets } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { useConnectors } from 'wagmi';
import { XConnector } from '../core';
import { XChainType } from '../types';
import { EvmXConnector } from '../xchains/evm';
import { useStellarXConnectors } from '../xchains/stellar/useStellarXConnectors';
import { SuiXConnector } from '../xchains/sui';
import { useXService } from './useXService';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaXConnector } from '../xchains/solana';

export function useXConnectors(xChainType: XChainType | undefined): XConnector[] {
  const xService = useXService(xChainType);
  const evmConnectors = useConnectors();
  const suiWallets = useWallets();
  const { data: stellarXConnectors } = useStellarXConnectors();

  const { wallets: solanaWallets } = useWallet();

  const xConnectors = useMemo((): XConnector[] => {
    if (!xChainType || !xService) {
      return [];
    }

    switch (xChainType) {
      case 'EVM':
        return evmConnectors.map(connector => new EvmXConnector(connector));
      case 'SUI':
        return suiWallets.map(wallet => new SuiXConnector(wallet));
      case 'STELLAR':
        return stellarXConnectors || [];
      case 'SOLANA':
        return solanaWallets
          .filter(wallet => wallet.readyState === 'Installed')
          .map(wallet => new SolanaXConnector(wallet));
      default:
        return xService.getXConnectors();
    }
  }, [xService, xChainType, evmConnectors, suiWallets, stellarXConnectors, solanaWallets]);

  return xConnectors;
}
