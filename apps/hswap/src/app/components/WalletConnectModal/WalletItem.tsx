import React, { useCallback, useMemo } from 'react';

import CopyableAddress from '@/app/components2/CopyableAddress';
import { Button } from '@/components/ui/button';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXAccount, useXConnect, useXConnection, useXConnectors, useXDisconnect } from '@/xwagmi/hooks';
import { XChainType } from '@balancednetwork/sdk-core';

export type WalletItemProps = {
  name: string;
  xChainType: XChainType;
};

export const handleConnectWallet = (
  xChainType: XChainType | undefined,
  xConnectors: XConnector[],
  xConnect: (xConnector: XConnector) => Promise<void>,
) => {
  if (!xChainType) return;
  if (!xConnectors || xConnectors.length === 0) return;

  if (xChainType === 'EVM') {
    modalActions.openModal(MODAL_ID.EVM_WALLET_OPTIONS_MODAL);
  } else if (xChainType === 'INJECTIVE') {
    modalActions.openModal(MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL);
  } else if (xChainType === 'SUI') {
    modalActions.openModal(MODAL_ID.SUI_WALLET_OPTIONS_MODAL);
  } else {
    xConnect(xConnectors[0]);
  }
};

const WalletItem = ({ name, xChainType }: WalletItemProps) => {
  const xConnection = useXConnection(xChainType);
  const { address } = useXAccount(xChainType);

  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();
  const xDisconnect = useXDisconnect();

  const handleConnect = useCallback(
    (xConnector: XConnector) => {
      xConnect(xConnector);
    },
    [xConnect],
  );

  const handleDisconnect = useCallback(() => {
    xDisconnect(xChainType);
  }, [xDisconnect, xChainType]);

  ///////////////////////////////////////////////////////////////////////////////////////////
  const activeXConnector = useMemo(() => {
    return xConnectors.find(connector => connector.id === xConnection?.xConnectorId);
  }, [xConnectors, xConnection]);

  const sortedXConnectors = useMemo(() => {
    const hanaWallet = xConnectors.find(connector => connector.name === 'Hana Wallet');
    if (!hanaWallet) return xConnectors;

    const filteredConnectors = xConnectors.filter(connector => connector.name !== 'Hana Wallet');
    return [hanaWallet, ...filteredConnectors];
  }, [xConnectors]);

  return (
    <div className="flex flex-col gap-4 px-10 text-[#0d0229]">
      <div className="flex justify-between gap-4">
        <div className="text-base font-bold">{name}</div>
        {address && (
          <div className="text-body cursor-pointer" onClick={handleDisconnect}>
            disconnect
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-4">
        {address ? (
          <div className="flex justify-between items-center h-[48px] rounded-full w-full">
            <div className="flex gap-3 justify-start">
              <img width={28} height={28} src={activeXConnector?.icon} />
              {activeXConnector?.name}
            </div>
            <CopyableAddress account={address} />
          </div>
        ) : (
          <>
            {sortedXConnectors.map(xConnector => {
              return (
                <div
                  key={`${xChainType}-${xConnector.name}`}
                  className="flex gap-3 justify-start items-center cursor-pointer h-[48px] rounded-full w-[calc(50%-8px)]"
                  onClick={() => handleConnect(xConnector)}
                >
                  <img width={28} height={28} src={xConnector.icon} />
                  {xConnector.name}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default WalletItem;
