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

export const STAKING_ADDRESS = 'cxc337abaf1b24e13e827644501716ebaaab9493f2';

export const LOAN_ADDRESS = 'cxc3a8dd98d922e2a1e4a6e9c836c410a1d564ad7e';

export const REWARD_ADDRESS = 'cx67da40d0c49fa340954c6945c83860b52a581653';

export const DEX_ADDRESS = 'cxdf85ae1d175a8978955a0149914ad697d78d18fe';

export const sICX_ADDRESS = 'cxcdae80da2964665c5b2480477a44b9646511d7ee';

export const bnUSD_ADDRESS = 'cx0399a75f88323f13daea97f114440f14fd551494';

export const BALN_ADDRESS = 'cxdfa188a9ef06d9e6a5118b9c73c3fac1567bc889';

export const BAND_ADDRESS = 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964';

export const BALNbnUSDpoolId = 3;

export const sICXbnUSDpoolId = 2;

export const sICXICXpoolId = 1;

export const API_VERSION = IconConverter.toBigNumber(3);

export const iconService = new IconService(new IconService.HttpProvider('https://bicon.net.solidwallet.io/api/v3'));

export const iconBuilder = new IconBuilder.CallBuilder();

export const getDefaultStepCost = async () => {
  const getStepCostsCall = iconBuilder.to(GOVERNANCE_BASE_ADDRESS).method('getStepCosts').build();
  const { default: defaultStepCost } = await iconService.call(getStepCostsCall).execute();
  return defaultStepCost;
};

interface ICONReactContextInterface {
  account?: string | null;
  request: (event: ICONexRequestEvent) => Promise<ICONexResponseEvent>;
  requestAddress: () => void;
  iconService: any;
  hasExtension: boolean;
  disconnect: () => void;
}

const IconReactContext = React.createContext<ICONReactContextInterface>({
  account: undefined,
  request: request,
  requestAddress: () => null,
  iconService: iconService,
  hasExtension: false,
  disconnect: () => null,
});

export function IconReactProvider({ children }) {
  const [account, setAccount] = React.useState<string | null>();
  const [hasExtension, setHasExtension] = React.useState<boolean>(false);

  const requestAddress = React.useCallback(async () => {
    const detail = await request({
      type: ICONexRequestEventType.REQUEST_ADDRESS,
    });

    if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
      setAccount(detail?.payload);
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
    requestAddress,
    request,
    iconService,
    hasExtension,
    disconnect,
  };

  return <IconReactContext.Provider value={context}>{children}</IconReactContext.Provider>;
}

export function useIconReact() {
  const context = React.useContext(IconReactContext);

  return context;
}
