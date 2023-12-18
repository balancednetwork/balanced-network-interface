import React, { useEffect } from 'react';

import { SupportedChainId as NetworkId, CHAIN_INFO, getLedgerAddressPath } from '@balancednetwork/balanced-js';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import IconService, { Builder as IconBuilder, Converter as IconConverter } from 'icon-sdk-js';
import {
  request,
  ICONexResponseEvent,
  ICONexRequestEvent,
  ICONexRequestEventType,
  ICONexResponseEventType,
} from 'packages/iconex';

import bnJs from 'bnJs';
import { useLocalStorageWithExpiry } from 'hooks/useLocalStorage';

export const GOVERNANCE_BASE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const LOCAL_STORAGE_ADDRESS_EXPIRY = 3600000;

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
  account: null,
  ledgerAddressPoint: -1,
  request: request,
  requestAddress: (ledgerAccount?: { address: string; point: number }) => null,
  iconService: iconService,
  hasExtension: false,
  disconnect: () => null,
  networkId: NetworkId.MAINNET,
});

export function IconReactProvider({ children }) {
  const [ledgerAddressPoint, setLedgerAddressPoint] = useLocalStorageWithExpiry<number>(
    'ledgerAddressPointWithExpiry',
    -1,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );
  const [account, setAccount] = useLocalStorageWithExpiry<string | null>(
    'accountWithExpiry',
    null,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );
  const [hasExtension, setHasExtension] = React.useState<boolean>(false);

  useEffect(() => {
    async function createConnection() {
      if (ledgerAddressPoint >= 0) {
        const transport = await TransportWebHID.create();
        transport.setDebugMode && transport.setDebugMode(false);
        bnJs.inject({
          account,
          legerSettings: {
            transport,
            path: getLedgerAddressPath(ledgerAddressPoint),
          },
        });
      }
    }
    createConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAddress = React.useCallback(
    async (ledgerAccount?: { address: string; point: number }) => {
      if (!ledgerAccount) {
        setLedgerAddressPoint(-1);
        bnJs.resetContractLedgerSettings();
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
    },
    [setAccount, setLedgerAddressPoint],
  );

  const disconnect = React.useCallback(() => {
    setAccount(null);
    setLedgerAddressPoint(-1);
    bnJs.resetContractLedgerSettings();
  }, [setAccount, setLedgerAddressPoint]);

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
