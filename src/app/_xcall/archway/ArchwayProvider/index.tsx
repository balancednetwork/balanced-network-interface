import React, { createContext, useEffect, useState } from 'react';

import { SupportedChainId } from '@balancednetwork/balanced-js';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { AccountData } from '@keplr-wallet/types';

import { NETWORK_ID } from 'constants/config';

import { ARCHWAY_RPC_PROVIDER } from '../config';
import { CONSTANTINE_CHAIN_INFO } from '../testnetChainInfo';

interface ArchwayContextType {
  address: string;
  chain_id: string;
  connectToWallet: () => void;
  disconnect: () => void;
  client?: StargateClient;
  signingClient?: SigningStargateClient;
  signingCosmWasmClient?: SigningCosmWasmClient;
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
  const [client, setClient] = useState<StargateClient>();
  const [signingClient, setSigningClient] = useState<SigningStargateClient>();
  const [signingCosmWasmClient, setSigningCosmWasmClient] = useState<SigningCosmWasmClient>();

  useEffect(() => {
    async function connectToRPC() {
      const client = await StargateClient.connect(ARCHWAY_RPC_PROVIDER);
      const chainId = await client.getChainId();
      setClient(client);
      setChainId(chainId);
    }
    connectToRPC();
  }, []);

  const connectToWallet = async () => {
    const { keplr } = window as any;
    if (!keplr) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap');
      return;
    }
    if (NETWORK_ID === SupportedChainId.MAINNET) {
      await keplr.enable(chain_id);
    }
    if (chain_id === 'constantine-3') {
      await keplr.experimentalSuggestChain(CONSTANTINE_CHAIN_INFO);
    }

    // @ts-ignore
    const offlineSigner = window.getOfflineSigner(chain_id);
    const signingClientObj = await SigningStargateClient.connectWithSigner(ARCHWAY_RPC_PROVIDER, offlineSigner);
    setSigningClient(signingClientObj);

    const signingCosmWasmClientObj = await SigningCosmWasmClient.connectWithSigner(ARCHWAY_RPC_PROVIDER, offlineSigner);
    setSigningCosmWasmClient(signingCosmWasmClientObj);

    const account: AccountData = (await offlineSigner.getAccounts())[0];
    account.address && setAddress(account.address);
  };

  const disconnect = (): void => {
    signingClient?.disconnect();
    client?.disconnect();
    setAddress('');
    setSigningClient(undefined);
    setClient(undefined);
  };

  const context = {
    address,
    chain_id,
    connectToWallet,
    client,
    signingClient,
    signingCosmWasmClient,
    disconnect,
  };

  return <ArchwayContext.Provider value={context}>{children}</ArchwayContext.Provider>;
};

function useArchwayContext() {
  const context = React.useContext(ArchwayContext);

  return context;
}

export { ArchwayContext, ArchwayProvider, useArchwayContext };
