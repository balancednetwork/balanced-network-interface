import React from 'react';

import IconService, { IconBuilder, IconConverter } from 'icon-sdk-js';
import { request, ICONexResponseEvent, ICONexRequestEvent } from 'packages/iconex';

export const GOVERNANCE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export const iconService = new IconService(new IconService.HttpProvider('https://bicon.net.solidwallet.io/api/v3'));

export const getDefaultStepCost = async () => {
  const builder = new IconBuilder.CallBuilder();
  const getStepCostsCall = builder.to(GOVERNANCE_ADDRESS).method('getStepCosts').build();
  const { default: defaultStepCost } = await iconService.call(getStepCostsCall).execute();
  return defaultStepCost;
};

interface ICONReactContextInterface {
  account?: string | null;
  request: (event: ICONexRequestEvent) => Promise<ICONexResponseEvent>;
  requestAddress: () => void;
  iconService: any;
}

const IconReactContext = React.createContext<ICONReactContextInterface>({
  account: undefined,
  request: request,
  requestAddress: () => null,
  iconService: iconService,
});

export function IconReactProvider({ children }) {
  const [account, setAccount] = React.useState<string | null>();

  const requestAddress = React.useCallback(async () => {
    const detail = await request({
      type: 'REQUEST_ADDRESS',
    });

    setAccount(detail?.payload);
  }, []);

  const context: ICONReactContextInterface = { account, requestAddress, request, iconService };

  return <IconReactContext.Provider value={context}>{children}</IconReactContext.Provider>;
}

export function useIconReact() {
  const context = React.useContext(IconReactContext);

  return context;
}
