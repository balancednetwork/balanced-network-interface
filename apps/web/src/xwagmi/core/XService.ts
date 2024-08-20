import { XChainType } from '@/types';
import { XConnector } from './XConnector';

export abstract class XService {
  xChainType: XChainType;
  xConnectors: XConnector[] = [];

  constructor(xChainType: XChainType) {
    this.xChainType = xChainType;
  }

  getXConnectors(): XConnector[] {
    return this.xConnectors;
  }

  setXConnectors(xConnectors: XConnector[]): void {
    this.xConnectors = xConnectors;
  }
}
