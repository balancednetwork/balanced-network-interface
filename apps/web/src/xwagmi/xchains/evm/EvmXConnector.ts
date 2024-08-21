import { wagmiConfig } from '@/config/wagmi';
import { XConnector } from '@/xwagmi/core/XConnector';
import { XAccount } from '@/xwagmi/core/types';
import { connect, disconnect } from '@wagmi/core';
import { Connector } from 'wagmi';

export class EvmXConnector extends XConnector {
  connector: Connector;

  constructor(connector: Connector) {
    super('EVM', connector.name, connector.id);
    this.connector = connector;
  }

  async connect(): Promise<XAccount | undefined> {
    // @ts-ignore
    await connect(wagmiConfig, { connector: this.connector });

    return;
  }

  async disconnect(): Promise<void> {
    // @ts-ignore
    await disconnect(wagmiConfig);
  }

  public get id() {
    return this.connector.id;
  }
  public get icon() {
    return this.connector.icon;
  }
}
