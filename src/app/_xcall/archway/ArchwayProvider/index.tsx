import React, { createContext, useEffect, useState } from 'react';

import { SigningArchwayClient, ArchwayClient } from '@archwayhq/arch3.js';
import { SupportedChainId } from '@balancednetwork/balanced-js';
import { AccountData } from '@keplr-wallet/types';

import { NETWORK_ID } from 'constants/config';
import { useBlockNumber } from 'store/application/hooks';
import { useAddDestinationEvent } from 'store/xCall/hooks';

import { ARCHWAY_RPC_PROVIDER } from '../config';
import { CONSTANTINE_CHAIN_INFO } from '../testnetChainInfo';
import ICONListener from './ICONListener';

interface ArchwayContextType {
  address: string;
  chain_id: string;
  connectToWallet: () => void;
  disconnect: () => void;
  client?: ArchwayClient;
  signingClient?: SigningArchwayClient;
  signingCosmWasmClient?: SigningArchwayClient;
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
  const [signingCosmWasmClient, setSigningCosmWasmClient] = useState<SigningArchwayClient>();
  const iconBlockHeight = useBlockNumber();
  const blockHeightRef = React.useRef<string | null>(null);
  const shouldListen = true; //TODO: should listen after tx init
  const addDestinationEvent = useAddDestinationEvent();

  useEffect(() => {
    async function connectToRPC() {
      const client = await ArchwayClient.connect(ARCHWAY_RPC_PROVIDER);
      const chainId = await client.getChainId();
      setClient(client);
      setChainId(chainId);
    }
    connectToRPC();
  }, []);

  useEffect(() => {
    if (shouldListen && iconBlockHeight) {
      if (!blockHeightRef.current) {
        blockHeightRef.current = `0x${iconBlockHeight.toString(16)}`;
      }
    } else {
      blockHeightRef.current = null;
    }
  }, [iconBlockHeight, shouldListen]);

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
    const signingClientObj = await SigningArchwayClient.connectWithSigner(ARCHWAY_RPC_PROVIDER, offlineSigner);
    setSigningClient(signingClientObj);

    const signingCosmWasmClientObj = await SigningArchwayClient.connectWithSigner(ARCHWAY_RPC_PROVIDER, offlineSigner);
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

  return (
    <ArchwayContext.Provider value={context}>
      {children}
      <>----debug messages----</>
      {shouldListen && blockHeightRef.current && (
        <ICONListener blockHeight={blockHeightRef.current} addDestinationEvent={addDestinationEvent} />
      )}
    </ArchwayContext.Provider>
  );
};

function useArchwayContext() {
  const context = React.useContext(ArchwayContext);

  return context;
}

export { ArchwayContext, ArchwayProvider, useArchwayContext };
