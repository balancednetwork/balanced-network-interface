import { XChainId } from '@/types';
import { useCallback, useState } from 'react';

export default function useManualAddresses(): {
  manualAddresses: { [xChainId: string]: string | undefined };
  setManualAddress: (xChainId: XChainId, address: string | undefined) => void;
} {
  const [manualAddresses, setManualAddress] = useState<{ [xChainId: string]: string | undefined }>({});

  const handleSetManualAddress = useCallback((xChainId: XChainId, address: string | undefined) => {
    setManualAddress(prev => ({ ...prev, [xChainId]: address }));
  }, []);

  return { manualAddresses, setManualAddress: handleSetManualAddress };
}
