import React, { useCallback, useMemo } from 'react';

import CopyableAddress from '@/app/components2/CopyableAddress';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { XConnector } from '@/xwagmi/core';
import { useXAccount, useXConnect, useXConnection, useXConnectors, useXDisconnect } from '@/xwagmi/hooks';
import { XChainType } from '@balancednetwork/sdk-core';
import { XIcon } from 'lucide-react';

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
    <div className="flex items-center gap-6 px-10 text-[#0d0229]">
      <div className="w-[76px] text-right text-black text-xs font-bold leading-none">{name}</div>

      <div className="flex flex-wrap justify-start gap-2 grow">
        {address ? (
          <div className="flex justify-between items-center w-full">
            <div className="cursor-pointer w-10 h-10 p-1 bg-white rounded-[11px] justify-center items-center inline-flex">
              <img src={activeXConnector?.icon} className="w-full h-full rounded-lg" />
            </div>
            <div className="flex gap-1 lowercase">
              <CopyableAddress account={address} />
              <div className="text-body cursor-pointer" onClick={handleDisconnect}>
                <XIcon />
              </div>
            </div>
          </div>
        ) : (
          <>
            {sortedXConnectors.map(xConnector => {
              return (
                <div
                  key={`${xChainType}-${xConnector.name}`}
                  className="cursor-pointer w-10 h-10 p-1 bg-[#d4c5f9] rounded-[11px] justify-center items-center inline-flex"
                  onClick={() => handleConnect(xConnector)}
                >
                  <img src={xConnector.icon} className="w-full h-full rounded-lg" />
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
