import { XChainType } from '@/types';
import { XConnector } from './XConnector';

export abstract class XService {
  xChainType: XChainType;
  xConnectors: XConnector[];

  constructor(xChainType: XChainType, xConnectors: XConnector[]) {
    this.xChainType = xChainType;
    this.xConnectors = xConnectors;
  }

  getXConnectors(): XConnector[] {
    return this.xConnectors;
  }
}
