import { wagmiConfig } from '@/config/wagmi';
import { XService } from '@/xwagmi/core/XService';
import { getConnectors } from '@wagmi/core';
import { EvmXConnector } from './EvmXConnector';

export class EvmXService extends XService {
  private static instance: EvmXService;

  private constructor() {
    super('EVM');
  }

  getXConnectors() {
    //@ts-ignore
    const connectors = getConnectors(wagmiConfig);

    return connectors.map((connector: any) => new EvmXConnector(this, connector));
  }

  public static getInstance(): EvmXService {
    if (!EvmXService.instance) {
      EvmXService.instance = new EvmXService();
    }
    return EvmXService.instance;
  }
}
