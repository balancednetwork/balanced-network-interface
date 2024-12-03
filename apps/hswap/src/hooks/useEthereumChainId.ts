import { useXService } from '@balancednetwork/xwagmi';
import { InjectiveXService } from '@balancednetwork/xwagmi';
import { Wallet } from '@injectivelabs/wallet-ts';
import React from 'react';
import { useEffect } from 'react';

export default function useEthereumChainId(): number | null {
  const injectiveXService = useXService('INJECTIVE') as unknown as InjectiveXService;
  const [ethereumChainId, setEthereumChainId] = React.useState<number | null>(null);
  useEffect(() => {
    if (!injectiveXService) {
      return;
    }

    const walletStrategy = injectiveXService.walletStrategy;
    const metamaskProvider = (window as any).ethereum as any;

    if (!metamaskProvider) {
      return;
    }

    const getEthereumChainId = async () => {
      if (walletStrategy.getWallet() === Wallet.Metamask) {
        const chainId = await walletStrategy.getEthereumChainId();
        setEthereumChainId(parseInt(chainId));
      }
    };
    if (walletStrategy.getWallet() === Wallet.Metamask) {
      metamaskProvider.on('chainChanged', getEthereumChainId);
      getEthereumChainId();
    }
    return () => {
      metamaskProvider.off('chainChanged', getEthereumChainId);
    };
  }, [injectiveXService]);

  return ethereumChainId;
}
