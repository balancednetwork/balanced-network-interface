import { useCallback } from 'react';
import { useXDisconnect } from './useXDisconnect';

export function useXDisconnectAll() {
  const xDisconnect = useXDisconnect();

  const disconnectAll = useCallback(async () => {
    await Promise.all([xDisconnect('ARCHWAY'), xDisconnect('ICON'), xDisconnect('HAVAH'), xDisconnect('EVM')]);
  }, [xDisconnect]);
  return disconnectAll;
}
