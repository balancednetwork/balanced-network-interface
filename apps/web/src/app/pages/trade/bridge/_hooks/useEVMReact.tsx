import { useAccount, useDisconnect } from 'wagmi';
import { useMemo } from 'react';
import { xChains } from '../_config/xChains';

const useEVMReact = () => {
  const { address, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const xChainId = xChains.find(xChain => xChain.id === chainId)?.xChainId;

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
