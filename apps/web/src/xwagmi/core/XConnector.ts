import { XChainType } from '@/types';

export abstract class XConnector {
  xChainType: XChainType;
  name: string;

  constructor(xChainType: XChainType, name: string) {
    this.xChainType = xChainType;
    this.name = name;
  }

  abstract connect(): Promise<string | undefined>;
  abstract disconnect(): Promise<void>;
}
