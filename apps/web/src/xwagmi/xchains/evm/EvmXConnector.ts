import { wagmiConfig } from '@/config/wagmi';
import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';
import { connect, disconnect } from '@wagmi/core';
import { Connector } from 'wagmi';

export class EvmXConnector extends XConnector {
  connector: Connector;

  constructor(connector: Connector) {
    super('EVM', connector.name);

    this.connector = connector;
  }

  async connect(): Promise<string | undefined> {
    // @ts-ignore
    await connect(wagmiConfig, { connector: this.connector });

    return '0x123'; // it's dummy address in purpose
  }

  async disconnect(): Promise<void> {
    // @ts-ignore
    await disconnect(wagmiConfig);
  }
}
