import { useAccount, useChainId, useDisconnect } from 'wagmi';
import { useMemo } from 'react';
import { xChains } from '../_config/xChains';

const useEVMReact = () => {
  const { address } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const chainId = useChainId();
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
