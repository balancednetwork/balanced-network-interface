import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import { SupportedChainId as NetworkId, CHAIN_INFO } from '@balancednetwork/balanced-js';
import IconService, { Builder as IconBuilder, Converter as IconConverter } from 'icon-sdk-js';
import {
  request,
  ICONexResponseEvent,
  ICONexRequestEvent,
  ICONexRequestEventType,
  ICONexResponseEventType,
} from '@/packages/iconex';

import bnJs from '@/bnJs';
import { useLocalStorageWithExpiry } from '@/hooks/useLocalStorage';

export const GOVERNANCE_BASE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const LOCAL_STORAGE_ADDRESS_EXPIRY = 3600000;

const iconService = new IconService(new IconService.HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint));

interface ICONReactContextInterface {
  account?: string | null;
  request: (event: ICONexRequestEvent) => Promise<ICONexResponseEvent>;
  requestAddress: () => void;
  iconService: IconService;
  hasExtension: boolean;
  connectToWallet: () => void;
  disconnect: () => void;
  networkId: NetworkId;
}

const IconReactContext = React.createContext<ICONReactContextInterface>({
  account: null,
  request: request,
  requestAddress: () => null,
  iconService: iconService,
  hasExtension: false,
  connectToWallet: () => null,
  disconnect: () => null,
  networkId: NetworkId.MAINNET,
});

export function IconReactProvider({ children }) {
  const [account, setAccount] = useLocalStorageWithExpiry<string | null>(
    'accountWithExpiry',
    null,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );
  const [hasExtension, setHasExtension] = React.useState<boolean>(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    async function createConnection() {
      bnJs.inject({ account });
    }
    createConnection();
  }, []);

  const requestAddress = React.useCallback(async () => {
    const detail = await request({
      type: ICONexRequestEventType.REQUEST_ADDRESS,
    });

    if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
      setAccount(detail?.payload);
    }
  }, [setAccount]);

  const connectToWallet = React.useCallback(() => {
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  }, [hasExtension, requestAddress]);

  const disconnect = React.useCallback(() => {
    setAccount(null);
  }, [setAccount]);

  React.useEffect(() => {
    const handler = async () => {
      await request({ type: ICONexRequestEventType.REQUEST_HAS_ACCOUNT });
      setHasExtension(true);
    };

    handler();
    const delayedHandler = () => setTimeout(handler, 200);
    window.addEventListener('load', delayedHandler);

    return () => {
      window.removeEventListener('load', delayedHandler);
    };
  }, []);

  const context: ICONReactContextInterface = {
    account,
    requestAddress,
    request,
    iconService,
    hasExtension,
    connectToWallet,
    disconnect,
    networkId: NETWORK_ID,
  };

  return <IconReactContext.Provider value={context}>{children}</IconReactContext.Provider>;
}

export function useIconReact() {
  const context = React.useContext(IconReactContext);

  return context;
}
