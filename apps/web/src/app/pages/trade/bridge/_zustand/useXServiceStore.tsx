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
  xServices: Record<string, XService>;
};

export const useXServiceStore = create<XServiceStore>()(set => ({
  xServices: {},
}));

export const xServiceActions = {
  getAllXServices: () => {
    return useXServiceStore.getState().xServices;
  },
  getXService: (xChainId: XChainId) => {
    const xService = useXServiceStore.getState().xServices[xChainId];
    return xService;
  },
  setXService: (xChainId: XChainId, xService: XService) => {
    useXServiceStore.setState({
      xServices: {
        ...useXServiceStore.getState().xServices,
        [xChainId]: xService,
      },
    });
  },

  removeXService: (xChainId: XChainId) => {
    const xServices = useXServiceStore.getState().xServices;
    delete xServices[xChainId];
    useXServiceStore.setState({ xServices });
  },
  removeAllXServices: () => {
    useXServiceStore.setState({ xServices: {} });
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
    const xService = new XServiceClass(xChainId, serviceConfig);
    xServiceActions.setXService(xChainId, xService);
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
