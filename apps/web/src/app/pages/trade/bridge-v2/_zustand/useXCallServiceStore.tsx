import { useEffect } from 'react';
import { create } from 'zustand';

import { useIconReact } from 'packages/icon-react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useBridgeInfo } from 'store/bridge/hooks';
import { IconXCallService } from '../_xcall/IconXCallService';
import { ArchwayXCallService } from '../_xcall/ArchwayXCallService';
import { XCallService } from '../_xcall/types';
import { XChainId } from 'app/_xcall/types';

type XCallServiceStore = {
  xCallServices: Record<string, XCallService>;
};

export const useXCallServiceStore = create<XCallServiceStore>()(set => ({
  xCallServices: {},
}));

export const xCallServiceActions = {
  getXCallService: (xChainId: XChainId) => {
    const xCallService = useXCallServiceStore.getState().xCallServices[xChainId];
    return xCallService;
  },
  setXCallService: (xChainId: XChainId, xCallService: XCallService) => {
    useXCallServiceStore.setState({
      xCallServices: {
        ...useXCallServiceStore.getState().xCallServices,
        [xChainId]: xCallService,
      },
    });
  },

  removeXCallService: (xChainId: XChainId) => {
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
    const createXCallService = (xChainId: XChainId) => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        const iconXCallService = new IconXCallService(xChainId, iconService, changeShouldLedgerSign);
        xCallServiceActions.setXCallService(xChainId, iconXCallService);
      } else if (xChainId === 'archway-1' || xChainId === 'archway') {
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
