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
import { EvmXCallService } from '../_xcall/EvmXCallService';
import { usePublicClient, useWalletClient } from 'wagmi';

type XCallServiceStore = {
  xCallServices: Record<string, XCallService>;
};

export const useXCallServiceStore = create<XCallServiceStore>()(set => ({
  xCallServices: {},
}));

export const xCallServiceActions = {
  getAllXCallServices: () => {
    return useXCallServiceStore.getState().xCallServices;
  },
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

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const createXCallService = (XCallServiceClass, xChainId: XChainId, serviceConfig: any) => {
    const xCallService = new XCallServiceClass(xChainId, serviceConfig);
    xCallServiceActions.setXCallService(xChainId, xCallService);
  };

  useEffect(() => {
    const setupXCallService = (xChainId: XChainId) => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        createXCallService(IconXCallService, xChainId, { iconService, changeShouldLedgerSign });
      } else if (xChainId === 'archway-1' || xChainId === 'archway') {
        createXCallService(ArchwayXCallService, xChainId, { client, signingClient });
      } else if (xChainId === '0xa86a.avax' || xChainId === '0xa869.fuji') {
        createXCallService(EvmXCallService, xChainId, { publicClient, walletClient });
      }
    };

    setupXCallService(bridgeDirection.from);
    setupXCallService(bridgeDirection.to);
  }, [
    bridgeDirection,
    bridgeDirection.from,
    bridgeDirection.to,
    client,
    signingClient,
    iconService,
    changeShouldLedgerSign,
    publicClient,
    walletClient,
    createXCallService,
  ]);

  return true;
};
