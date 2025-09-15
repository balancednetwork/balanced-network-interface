import {
  InjectiveXService,
  XChainId,
  getXChainType,
  switchEthereumChain,
  useAccount,
  useSwitchChain,
  useXService,
  xChainMap,
} from '@balancednetwork/xwagmi';
import { Wallet } from '@injectivelabs/wallet-ts';
import { useCallback, useMemo } from 'react';
import { mainnet } from 'viem/chains';
import useEthereumChainId from './useEthereumChainId';

export const useEvmSwitchChain = (expectedXChainId: XChainId) => {
  const xChainType = getXChainType(expectedXChainId);
  const expectedChainId = xChainMap[expectedXChainId].id as number;

  const injectiveXService = useXService('INJECTIVE') as unknown as InjectiveXService;
  const ethereumChainId = useEthereumChainId();

  const { chainId } = useAccount();
  const isWrongChain = useMemo(() => {
    return (
      (xChainType === 'EVM' && chainId !== expectedChainId) ||
      (xChainType === 'INJECTIVE' &&
        !window?.['ethereum']?.isHanaWallet &&
        injectiveXService.walletStrategy.getWallet() === Wallet.Metamask &&
        ethereumChainId !== mainnet.id)
    );
  }, [xChainType, chainId, expectedChainId, injectiveXService, ethereumChainId]);

  const { switchChain } = useSwitchChain();

  const handleSwitchChain = useCallback(() => {
    if (xChainType === 'INJECTIVE') {
      switchEthereumChain(mainnet.id);
    } else {
      switchChain({ chainId: expectedChainId });
    }
  }, [xChainType, switchChain, expectedChainId]);

  return { isWrongChain, handleSwitchChain };
};
