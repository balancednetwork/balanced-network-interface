import { XChainType } from '@/types';

export abstract class XService {
  xChainType: XChainType;

  constructor(xChainType: XChainType) {
    this.xChainType = xChainType;
  }

  abstract getXConnectors(): any;
}
