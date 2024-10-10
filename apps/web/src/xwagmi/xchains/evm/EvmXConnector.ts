import { XConnector } from '@/xwagmi/core/XConnector';
import { XAccount } from '@/xwagmi/types';
import { disconnect } from '@wagmi/core';
import { Connector } from 'wagmi';
import { wagmiConfig } from './wagmiConfig';

export class EvmXConnector extends XConnector {
  connector: Connector;

  constructor(connector: Connector) {
    super('EVM', connector.name, connector.id);
    this.connector = connector;
  }

  async connect(): Promise<XAccount | undefined> {
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
