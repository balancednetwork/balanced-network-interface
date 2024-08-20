import { walletStrategy } from '@/packages/injective';
import { Wallet } from '@injectivelabs/wallet-ts';
import React from 'react';
import { useEffect } from 'react';

export default function useEthereumChainId(): number | null {
  const [ethereumChainId, setEthereumChainId] = React.useState<number | null>(null);
  useEffect(() => {
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
  }, []);

  return ethereumChainId;
}
