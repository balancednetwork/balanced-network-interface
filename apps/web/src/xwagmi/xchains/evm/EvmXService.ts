import { wagmiConfig } from '@/config/wagmi';
import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';
import { getConnectors } from '@wagmi/core';
import { EvmXConnector } from './EvmXConnector';

export class EvmXService extends XService {
  constructor({ xConnectors }: { xConnectors: XConnector[] }) {
    super('EVM', xConnectors);
  }

  getXConnectors() {
    //@ts-ignore
    const connectors = getConnectors(wagmiConfig);

    return connectors.map((connector: any) => new EvmXConnector(connector));
  }
}
