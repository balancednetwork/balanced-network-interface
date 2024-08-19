import { XChainType } from '@/types';
import { XService } from './XService';

export abstract class XConnector {
  xService: XService;
  xChainType: XChainType;
  name: string;

  constructor(xService: XService, name: string) {
    this.xService = xService;
    this.xChainType = xService.xChainType;
    this.name = name;
  }

  abstract connect(): Promise<string | undefined>;
  abstract disconnect(): Promise<void>;
}
