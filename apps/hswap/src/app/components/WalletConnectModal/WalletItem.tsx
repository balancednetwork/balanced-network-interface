import React, { useCallback, useMemo } from 'react';

import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXAccount, useXConnect, useXConnection, useXConnectors, useXDisconnect } from '@/xwagmi/hooks';
import { XChainType } from '@balancednetwork/sdk-core';
import { CopyableAddress } from '../Header';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-4">
        <div className="text-subtitle">{name}</div>
        {address && (
          <div className="text-body cursor-pointer" onClick={handleDisconnect}>
            disconnect
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-4">
        {address ? (
          <div className="p-4 flex justify-between items-center bg-[#221542] h-[48px] rounded-full w-full">
            <div className="flex gap-3 justify-start">
              <img width={28} height={28} src={activeXConnector?.icon} />
              {activeXConnector?.name}
            </div>
            <CopyableAddress account={address} copyIcon placement="right" />
          </div>
        ) : (
          <>
            {xConnectors.map(xConnector => {
              return (
                <Button
                  key={`${xChainType}-${xConnector.name}`}
                  className="flex gap-3 justify-start bg-[#221542] h-[48px] rounded-full w-[180px]"
                  onClick={() => handleConnect(xConnector)}
                >
                  <img width={28} height={28} src={xConnector.icon} />
                  {xConnector.name}
                </Button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default WalletItem;
