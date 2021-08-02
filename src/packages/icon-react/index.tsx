import React from 'react';

import IconService, { IconBuilder, IconConverter } from 'icon-sdk-js';
import {
  request,
  ICONexResponseEvent,
  ICONexRequestEvent,
  ICONexRequestEventType,
  ICONexResponseEventType,
} from 'packages/iconex';

export const GOVERNANCE_BASE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const API_ENDPOINTS = {
  [NetworkId.MAINNET]: 'https://ctz.solidwallet.io/api/v3',
  [NetworkId.YEOUIDO]: 'https://bicon.net.solidwallet.io/api/v3',
};

export const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

const iconService = new IconService(new IconService.HttpProvider(API_ENDPOINTS[NETWORK_ID]));

export const getDefaultStepCost = async () => {
  const getStepCostsCall = new IconBuilder.CallBuilder().to(GOVERNANCE_BASE_ADDRESS).method('getStepCosts').build();
  const { default: defaultStepCost } = await iconService.call(getStepCostsCall).execute();
  return defaultStepCost;
};

interface ICONReactContextInterface {
  account?: string | null;
  ledgerAddressPoint: number;
  request: (event: ICONexRequestEvent) => Promise<ICONexResponseEvent>;
  requestAddress: (ledgerAccount?: { address: string; point: number }) => void;
  iconService: any;
  hasExtension: boolean;
  disconnect: () => void;
  networkId: NetworkId;
}

const IconReactContext = React.createContext<ICONReactContextInterface>({
  account: undefined,
  ledgerAddressPoint: -1,
  request: request,
  requestAddress: (ledgerAccount?: { address: string; point: number }) => null,
  iconService: iconService,
  hasExtension: false,
  disconnect: () => null,
  networkId: NetworkId.MAINNET,
});

export function IconReactProvider({ children }) {
  const [ledgerAddressPoint, setLedgerAddressPoint] = React.useState(-1);
  const [account, setAccount] = React.useState<string | null>();
  const [hasExtension, setHasExtension] = React.useState<boolean>(false);

  const requestAddress = React.useCallback(async (ledgerAccount?: { address: string; point: number }) => {
    if (!ledgerAccount) {
      const detail = await request({
        type: ICONexRequestEventType.REQUEST_ADDRESS,
      });

      if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
        setAccount(detail?.payload);
      }
    } else if (ledgerAccount) {
      setAccount(ledgerAccount?.address);
      setLedgerAddressPoint(ledgerAccount?.point || 0);
    }
  }, []);

  const disconnect = React.useCallback(() => {
    setAccount(null);
  }, []);

  React.useEffect(() => {
    const handler = async () => {
      await request({ type: ICONexRequestEventType.REQUEST_HAS_ACCOUNT });
      setHasExtension(true);
    };

    window.addEventListener('load', handler);

    return () => {
      window.removeEventListener('load', handler);
    };
  }, []);

  const context: ICONReactContextInterface = {
    account,
    ledgerAddressPoint,
    requestAddress,
    request,
    iconService,
    hasExtension,
    disconnect,
    networkId: NETWORK_ID,
  };

  return <IconReactContext.Provider value={context}>{children}</IconReactContext.Provider>;
}

export function useIconReact() {
  const context = React.useContext(IconReactContext);

  return context;
}
