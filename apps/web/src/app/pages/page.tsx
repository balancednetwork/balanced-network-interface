import { Button } from '@/components/ui/button';
import { XConnector } from '@/xwagmi/core/XConnector';
import { useXAccounts } from '@/xwagmi/hooks/useXAccounts';
import { useXConnect } from '@/xwagmi/hooks/useXConnect';
import { useXDisconnect } from '@/xwagmi/hooks/useXDisconnect';
import { XChainType } from '@/xwagmi/types';
import { useXWagmiStore } from '@/xwagmi/useXWagmiStore';
import React from 'react';

export function HomePage() {
  const xServices = useXWagmiStore(state => state.xServices);

  const connect = useXConnect();
  const handleConnect = async (xConnector: XConnector) => {
    await connect(xConnector);
  };

  const disconnect = useXDisconnect();
  const handleDisconnect = async (xChainType: XChainType) => {
    await disconnect(xChainType);
  };

  const xAccounts = useXAccounts();
  // console.log(xAccounts);

  return (
    <div className="flex flex-col gap-4">
      {Object.keys(xServices).map(xChainType => {
        const xService = xServices[xChainType];
        return (
          <div key={xChainType} className="flex flex-col gap-2">
            <h2 className="text-xl">{xChainType}</h2>

            {xAccounts[xChainType]?.address ? (
              <div>
                <h3>Connected Account</h3>
                <p>{xAccounts[xChainType]?.address}</p>
                <Button onClick={() => handleDisconnect(xService.xChainType)}>Disconnect</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {xService.getXConnectors().map((xConnector: XConnector) => (
                  <Button key={xConnector.name} onClick={() => handleConnect(xConnector)}>
                    {xConnector.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
