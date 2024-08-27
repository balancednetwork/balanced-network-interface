import { wagmiConfig } from '@/config/wagmi';
import { XService } from '@/xwagmi/core/XService';
import { getConnectors, getPublicClient, getWalletClient } from '@wagmi/core';
import { EvmXConnector } from './EvmXConnector';

export class EvmXService extends XService {
  private static instance: EvmXService;

  private constructor() {
    super('EVM');
  }

  getXConnectors() {
    //@ts-ignore
    const connectors = getConnectors(wagmiConfig);

    return connectors.map((connector: any) => new EvmXConnector(connector));
  }

  public getPublicClient(chainId) {
    //@ts-ignore
    return getPublicClient(wagmiConfig, { chainId });
  }

  public async getWalletClient(chainId) {
    //@ts-ignore
    return await getWalletClient(wagmiConfig, { chainId });
  }

  public static getInstance(): EvmXService {
    if (!EvmXService.instance) {
      EvmXService.instance = new EvmXService();
    }
    return EvmXService.instance;
  }
}
