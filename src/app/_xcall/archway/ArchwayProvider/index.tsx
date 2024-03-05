import React, { createContext, useEffect, useState } from 'react';

import { SigningArchwayClient, ArchwayClient } from '@archwayhq/arch3.js';
import { SupportedChainId } from '@balancednetwork/balanced-js';
import { AccountData } from '@keplr-wallet/types';
import { LOCAL_STORAGE_ADDRESS_EXPIRY } from 'packages/icon-react';

import { NETWORK_ID } from 'constants/config';
import { useLocalStorageWithExpiry } from 'hooks/useLocalStorage';

import { ARCHWAY_RPC_PROVIDER } from '../config';
import { CONSTANTINE_CHAIN_INFO } from '../testnetChainInfo';

interface ArchwayContextType {
  address: string;
  chain_id: string;
  connectToWallet: () => void;
  disconnect: () => void;
  client?: ArchwayClient;
  signingClient?: SigningArchwayClient;
}

const initialContext: ArchwayContextType = {
  address: '',
  chain_id: '',
  connectToWallet: () => {},
  disconnect: () => {},
};

const ArchwayContext = createContext<ArchwayContextType>(initialContext);

const ArchwayProvider: React.FC = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [chain_id, setChainId] = useState<string>('');
  const [client, setClient] = useState<ArchwayClient>();
  const [signingClient, setSigningClient] = useState<SigningArchwayClient>();
  const [addressStored, setAddressStored] = useLocalStorageWithExpiry<string | null>(
    'archAccountWithExpiry',
    null,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );

  useEffect(() => {
    async function connectToRPC() {
      const client = await ArchwayClient.connect(ARCHWAY_RPC_PROVIDER);
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
        await leap.enable(chain_id);
      } else {
        await keplr.enable(chain_id);
      }
    }
    if (chain_id === 'constantine-3') {
      if (leap) {
        await leap.experimentalSuggestChain(CONSTANTINE_CHAIN_INFO);
      } else {
        await keplr.experimentalSuggestChain(CONSTANTINE_CHAIN_INFO);
      }
    }

    // @ts-ignore
    const offlineSigner = leap ? leap.getOfflineSignerOnlyAmino(chain_id) : keplr.getOfflineSignerOnlyAmino(chain_id);
    const signingClientObj = await SigningArchwayClient.connectWithSigner(ARCHWAY_RPC_PROVIDER, offlineSigner);
    setSigningClient(signingClientObj);

    const account: AccountData = (await offlineSigner.getAccounts())[0];
    account.address && setAddress(account.address);
    account.address && setAddressStored(account.address);
  }, [chain_id, setAddress, setAddressStored]);

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
    chain_id,
    connectToWallet,
    client,
    signingClient,
    disconnect,
  };

  useEffect(() => {
    if (addressStored && !signingClient && chain_id) {
      connectToWallet();
    }
  }, [signingClient, addressStored, connectToWallet, chain_id]);

  return <ArchwayContext.Provider value={context}>{children}</ArchwayContext.Provider>;
};

function useArchwayContext() {
  const context = React.useContext(ArchwayContext);

  return context;
}

export { ArchwayContext, ArchwayProvider, useArchwayContext };
