import { XService } from '@/core/XService';
import { PublicClient, WalletClient } from 'viem';
import { getConnectors, getPublicClient, getWalletClient } from 'wagmi/actions';
import { EvmXConnector } from './EvmXConnector';
import { wagmiConfig } from './wagmiConfig';

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

  public getPublicClient(chainId): PublicClient {
    //@ts-ignore
    return getPublicClient(wagmiConfig, { chainId });
  }

  public async getWalletClient(chainId): Promise<WalletClient> {
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
