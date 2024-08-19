import React, { createContext, useEffect, useState } from 'react';

import { LOCAL_STORAGE_ADDRESS_EXPIRY } from '@/packages/icon-react';
import { ArchwayClient } from '@archwayhq/arch3.js';
import { SupportedChainId } from '@balancednetwork/balanced-js';
import { AccountData } from '@keplr-wallet/types';

import { NETWORK_ID } from '@/constants/config';
import { useLocalStorageWithExpiry } from '@/hooks/useLocalStorage';
import { XSigningArchwayClient } from '@/xwagmi/xchains/archway/XSigningArchwayClient';

interface ArchwayContextType {
  address: string;
  chainId: string;
  connectToWallet: () => void;
  disconnect: () => void;
  client?: ArchwayClient;
  signingClient?: XSigningArchwayClient;
}

const initialContext: ArchwayContextType = {
  address: '',
  chainId: '',
  connectToWallet: () => {},
  disconnect: () => {},
};

const ArchwayContext = createContext<ArchwayContextType>(initialContext);

const rpcURL = 'https://rpc.mainnet.archway.io';

const ArchwayProvider = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [client, setClient] = useState<ArchwayClient>();
  const [signingClient, setSigningClient] = useState<XSigningArchwayClient>();
  const [addressStored, setAddressStored] = useLocalStorageWithExpiry<string | null>(
    'archAccountWithExpiry',
    null,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );

  useEffect(() => {
    async function connectToRPC() {
      const client = await ArchwayClient.connect(rpcURL);
      const chainId = await client.getChainId();
      setClient(client);
      setChainId(chainId);
    }
    connectToRPC();
  }, []);

  const connectToWallet = React.useCallback(async () => {
    const { keplr } = window as any;
    const { leap } = window as any;
    if (!keplr && !leap) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    if (NETWORK_ID === SupportedChainId.MAINNET) {
      keplr.defaultOptions = {
        sign: {
          preferNoSetFee: true,
        },
      };
    }

    if (NETWORK_ID === SupportedChainId.MAINNET) {
      if (leap) {
        await leap.enable(chainId);
      } else {
        await keplr.enable(chainId);
      }
    }

    // @ts-ignore
    const offlineSigner = leap ? leap.getOfflineSignerOnlyAmino(chainId) : keplr.getOfflineSignerOnlyAmino(chainId);
    const signingClientObj = await XSigningArchwayClient.connectWithSigner(rpcURL, offlineSigner);
    setSigningClient(signingClientObj);

    const account: AccountData = (await offlineSigner.getAccounts())[0];
    account.address && setAddress(account.address);
    account.address && setAddressStored(account.address);
  }, [chainId, setAddressStored]);

  const disconnect = (): void => {
    signingClient?.disconnect();
    client?.disconnect();
    setAddress('');
    setSigningClient(undefined);
    setClient(undefined);
    setAddressStored(null);
  };

  const context = {
    address,
    chainId,
    connectToWallet,
    client,
    signingClient,
    disconnect,
  };

  useEffect(() => {
    if (addressStored && !signingClient && chainId) {
      connectToWallet();
    }
  }, [signingClient, addressStored, connectToWallet, chainId]);

  return <ArchwayContext.Provider value={context}>{children}</ArchwayContext.Provider>;
};

function useArchwayContext() {
  const context = React.useContext(ArchwayContext);

  return context;
}

export { ArchwayContext, ArchwayProvider, useArchwayContext };
