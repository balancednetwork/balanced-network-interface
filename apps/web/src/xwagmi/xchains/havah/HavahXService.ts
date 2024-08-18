import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';

export class HavahXService extends XService {
  constructor({ xConnectors }: { xConnectors: XConnector[] }) {
    super('HAVAH', xConnectors);
  }
}
