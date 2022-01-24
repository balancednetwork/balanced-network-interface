import React from 'react';

import IconService, { Builder as IconBuilder, Converter as IconConverter } from 'icon-sdk-js';
import { SupportedChainId as NetworkId, CHAIN_INFO } from 'packages/BalancedJs';
import {
  request,
  ICONexResponseEvent,
  ICONexRequestEvent,
  ICONexRequestEventType,
  ICONexResponseEventType,
} from 'packages/iconex';

export const GOVERNANCE_BASE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

const iconService = new IconService(new IconService.HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint));

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
  iconService: IconService;
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
        setAccount('cxee1fa51a14783577bc4b900c13579b9bcb0b55f5');
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
