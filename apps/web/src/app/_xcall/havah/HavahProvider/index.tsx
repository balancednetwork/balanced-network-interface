import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { LOCAL_STORAGE_ADDRESS_EXPIRY } from 'packages/icon-react';
import { useLocalStorageWithExpiry } from 'hooks/useLocalStorage';

interface AccountResultType {
  address: string;
  nid: string;
  error?: string;
}

interface HavahContextType {
  address: string;
  chain_id: string;
  connectToWallet: () => void;
  disconnect: () => void;
}

interface HavahProviderProps {
  children: ReactNode;
}

const initialContext: HavahContextType = {
  address: '',
  chain_id: '',
  connectToWallet: () => {},
  disconnect: () => {},
};

const HavahContext = createContext<HavahContextType>(initialContext);

const HavahProvider: React.FC<HavahProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [chain_id, setChainId] = useState<string>('');
  const [addressStored, setAddressStored] = useLocalStorageWithExpiry<string | null>(
    'havahAccountWithExpiry',
    null,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );

  useEffect(() => {
    const { havah } = window as any;
    if (!havah) {
      return;
    }

    havah.on('accountsChanged', ({ address }: { address: string }) => {
      setAddress(address);
      setAddressStored(address);
    });

    havah.on('networkChanged', ({ nid }: { nid: string }) => {
      setChainId(nid);
    });
  }, [setAddressStored]);

  const connectToWallet = useCallback(async () => {
    try {
      const { havah } = window as any;
      if (!havah) {
        window.open(
          'https://chromewebstore.google.com/detail/havah-wallet/cnncmdhjacpkmjmkcafchppbnpnhdmon?hl=en',
          '_blank',
        );
        return;
      }

      await havah.connect();
      const account: AccountResultType = await havah.accounts();
      if (account.address) {
        setAddress(account.address);
        setChainId(account.nid);
        setAddressStored(account.address);
      }
    } catch (e) {
      console.error('Error connecting to wallet:', e);
    }
  }, [setAddressStored]);

  const disconnect = useCallback((): void => {
    const { havah } = window as any;
    if (havah?.disconnect) {
      havah.disconnect();
    }
    setAddress('');
    setChainId('');
    setAddressStored(null);
  }, [setAddressStored]);

  const contextValue = {
    address,
    chain_id,
    connectToWallet,
    disconnect,
  };

  useEffect(() => {
    if (addressStored) {
      connectToWallet();
    }
  }, [addressStored, connectToWallet]);

  return <HavahContext.Provider value={contextValue}>{children}</HavahContext.Provider>;
};

function useHavahContext(): HavahContextType {
  const context = React.useContext(HavahContext);
  if (!context) {
    throw new Error('useHavahContext must be used within a HavahProvider');
  }
  return context;
}

export { HavahContext, HavahProvider, useHavahContext };
