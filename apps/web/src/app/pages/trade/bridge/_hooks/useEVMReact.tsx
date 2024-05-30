import { useAccount, useDisconnect } from 'wagmi';
import { useMemo } from 'react';

const useEVMReact = () => {
  const { address } = useAccount();
  const { disconnectAsync } = useDisconnect();

  return useMemo(
    () => ({
      account: address,
      disconnect: disconnectAsync,
    }),
    [address, disconnectAsync],
  );
};

export default useEVMReact;
