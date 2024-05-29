import { useEffect } from 'react';
import { create } from 'zustand';

import { useIconReact } from 'packages/icon-react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { IconXService } from '../_xcall/IconXService';
import { ArchwayXService } from '../_xcall/ArchwayXService';
import { XService } from '../_xcall/types';
import { XChainId } from 'app/pages/trade/bridge/types';
import { EvmXService } from '../_xcall/EvmXService';
import { usePublicClient, useWalletClient } from 'wagmi';

type XServiceStore = {
  xCallServices: Record<string, XService>;
};

export const useXServiceStore = create<XServiceStore>()(set => ({
  xCallServices: {},
}));

export const xCallServiceActions = {
  getAllXServices: () => {
    return useXServiceStore.getState().xCallServices;
  },
  getXService: (xChainId: XChainId) => {
    const xCallService = useXServiceStore.getState().xCallServices[xChainId];
    return xCallService;
  },
  setXService: (xChainId: XChainId, xCallService: XService) => {
    useXServiceStore.setState({
      xCallServices: {
        ...useXServiceStore.getState().xCallServices,
        [xChainId]: xCallService,
      },
    });
  },

  removeXService: (xChainId: XChainId) => {
    const xCallServices = useXServiceStore.getState().xCallServices;
    delete xCallServices[xChainId];
    useXServiceStore.setState({ xCallServices });
  },
  removeAllXServices: () => {
    useXServiceStore.setState({ xCallServices: {} });
  },
};

// TODO: create or update?
export const useCreateXService = (xChainId: XChainId) => {
  const { iconService } = useIconReact();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const { client, signingClient } = useArchwayContext();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const createXService = (XServiceClass, xChainId: XChainId, serviceConfig: any) => {
    const xCallService = new XServiceClass(xChainId, serviceConfig);
    xCallServiceActions.setXService(xChainId, xCallService);
  };

  useEffect(() => {
    const setupXService = (xChainId: XChainId) => {
      if (xChainId === '0x1.icon' || xChainId === '0x2.icon') {
        createXService(IconXService, xChainId, {
          publicClient: iconService,
          walletClient: iconService,
          changeShouldLedgerSign,
        });
      } else if (xChainId === 'archway-1' || xChainId === 'archway') {
        createXService(ArchwayXService, xChainId, { publicClient: client, walletClient: signingClient });
      } else if (xChainId === '0xa86a.avax' || xChainId === '0xa869.fuji') {
        createXService(EvmXService, xChainId, { publicClient, walletClient });
      }
    };

    setupXService(xChainId);
  }, [
    xChainId,
    client,
    signingClient,
    iconService,
    changeShouldLedgerSign,
    publicClient,
    walletClient,
    createXService,
  ]);

  return true;
};
