import { XChainType } from '@/types';
import { XService } from './XService';

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
