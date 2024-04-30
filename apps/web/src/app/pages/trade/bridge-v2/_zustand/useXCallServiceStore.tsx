import { useEffect } from 'react';
import { create } from 'zustand';

import { useIconReact } from 'packages/icon-react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useBridgeInfo, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { IconXCallService } from '../_xcall/IconXCallService';
import { ArchwayXCallService } from '../_xcall/ArchwayXCallService';

export const useXCallServiceStore = create(set => ({
  xCallServices: {},
}));

export const xCallServiceActions = {
  getXCallService: chainId => {
    const xCallService = useXCallServiceStore.getState().xCallServices[chainId];
    return xCallService;
  },
  setXCallService: (chainId, xCallService) => {
    useXCallServiceStore.setState({
      xCallServices: {
        ...useXCallServiceStore.getState().xCallServices,
        [chainId]: xCallService,
      },
    });
  },

  removeXCallService: chainId => {
    const xCallServices = useXCallServiceStore.getState().xCallServices;
    delete xCallServices[chainId];
    useXCallServiceStore.setState({ xCallServices });
  },
  removeAllXCallServices: () => {
    useXCallServiceStore.setState({ xCallServices: {} });
  },
};

// TODO: review logic
export const useXCallServiceFactory = () => {
  const { bridgeDirection } = useBridgeInfo();

  const { iconService } = useIconReact();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const { client, signingClient } = useArchwayContext();

  useEffect(() => {
    const createXCallService = chainId => {
      if (chainId === '0x1.icon' || chainId === '0x2.icon') {
        const iconXCallService = new IconXCallService(chainId, iconService, changeShouldLedgerSign);
        xCallServiceActions.setXCallService(chainId, iconXCallService);
      } else if (chainId === 'archway-1') {
        const archwayXCallService = new ArchwayXCallService(chainId, client, signingClient);
        xCallServiceActions.setXCallService(chainId, archwayXCallService);
      }
    };

    createXCallService(bridgeDirection.from);
    createXCallService(bridgeDirection.to);
  }, [
    bridgeDirection,
    bridgeDirection.from,
    bridgeDirection.to,
    client,
    signingClient,
    iconService,
    changeShouldLedgerSign,
  ]);

  return true;
};
