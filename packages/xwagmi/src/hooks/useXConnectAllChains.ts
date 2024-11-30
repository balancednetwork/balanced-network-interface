import { useCallback, useMemo } from 'react';
import { WalletId } from '../types';
import { useXConnectors } from './useXConnectors';
import { useXConnect } from './useXConnect';
import { useXChainTypes } from './useXChainTypes';
import { XConnector } from '../core';

const getWalletName = (walletId: WalletId) => {
  switch (walletId) {
    case WalletId.SUI:
      return 'Sui Wallet';
    case WalletId.HAVAH:
      return 'HAVAH';
    case WalletId.METAMASK:
      return 'MetaMask';
    case WalletId.PHANTOM:
      return 'Phantom';
    case WalletId.KEPLR:
      return 'Keplr';
    case WalletId.HANA:
      return 'Hana Wallet';
  }
};

const findXConnector = (connectors: XConnector[], walletId: WalletId) => {
  const walletName = getWalletName(walletId);

  return connectors.find(connector => connector.name === walletName);
};

export function useXConnectAllChains() {
  const iconXConnectors = useXConnectors('ICON');
  const evmXConnectors = useXConnectors('EVM');
  const solanaXConnectors = useXConnectors('SOLANA');
  const suiXConnectors = useXConnectors('SUI');
  const injectiveXConnectors = useXConnectors('INJECTIVE');
  const stellarXConnectors = useXConnectors('STELLAR');
  const archwayXConnectors = useXConnectors('ARCHWAY');
  const havahXConnectors = useXConnectors('HAVAH');

  const xChainTypes = useXChainTypes();

  const allXConnectors = useMemo(
    () => ({
      ICON: iconXConnectors,
      EVM: evmXConnectors,
      SOLANA: solanaXConnectors,
      SUI: suiXConnectors,
      INJECTIVE: injectiveXConnectors,
      STELLAR: stellarXConnectors,
      ARCHWAY: archwayXConnectors,
      HAVAH: havahXConnectors,
    }),
    [
      iconXConnectors,
      evmXConnectors,
      solanaXConnectors,
      suiXConnectors,
      injectiveXConnectors,
      stellarXConnectors,
      archwayXConnectors,
      havahXConnectors,
    ],
  );

  const xConnect = useXConnect();
  const connectAllChains = useCallback(
    async (walletId: WalletId) => {
      for (const xChainType of xChainTypes) {
        try {
          const connectors = allXConnectors[xChainType];

          const xConnector = findXConnector(connectors, walletId);
          if (xConnector) {
            await xConnect(xConnector);
          }
        } catch (e) {
          console.log(e);
        }
      }
    },
    [xChainTypes, allXConnectors, xConnect],
  );

  return connectAllChains;
}
