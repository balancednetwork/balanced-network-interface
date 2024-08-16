import { useAccount, useDisconnect } from 'wagmi';
import { useMemo } from 'react';
import { xChains } from '@/constants/xChains';
import { XWalletType } from '@/types';

const useEVMReact = () => {
  const { address, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const xChainId = xChains
    .filter(c => c.xWalletType === XWalletType.EVM)
    .find(xChain => xChain.id === chainId)?.xChainId;

  return useMemo(
    () => ({
      account: address,
      disconnect: disconnectAsync,
      xChainId: xChainId,
    }),
    [address, disconnectAsync, xChainId],
  );
};

export default useEVMReact;
