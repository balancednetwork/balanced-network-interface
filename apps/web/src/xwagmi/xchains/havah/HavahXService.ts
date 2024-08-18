import { XService } from '@/xwagmi/core/XService';
import { HavahXConnector } from './HavahXConnector';

export class HavahXService extends XService {
  constructor() {
    super('HAVAH');
  }

  getXConnectors() {
    return [new HavahXConnector()];
  }
}
