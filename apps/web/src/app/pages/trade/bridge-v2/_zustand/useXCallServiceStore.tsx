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
  getXCallService: xChainId => {
    const xCallService = useXCallServiceStore.getState().xCallServices[xChainId];
    return xCallService;
  },
  setXCallService: (xChainId, xCallService) => {
    useXCallServiceStore.setState({
      xCallServices: {
        ...useXCallServiceStore.getState().xCallServices,
        [xChainId]: xCallService,
      },
    });
  },

  removeXCallService: xChainId => {
    const xCallServices = useXCallServiceStore.getState().xCallServices;
    delete xCallServices[xChainId];
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
    const createXCallService = xChainId => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        const iconXCallService = new IconXCallService(xChainId, iconService, changeShouldLedgerSign);
        xCallServiceActions.setXCallService(xChainId, iconXCallService);
      } else if (xChainId === 'archway-1') {
        const archwayXCallService = new ArchwayXCallService(xChainId, client, signingClient);
        xCallServiceActions.setXCallService(xChainId, archwayXCallService);
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
