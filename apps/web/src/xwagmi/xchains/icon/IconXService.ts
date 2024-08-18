import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';

export class IconXService extends XService {
  constructor({ xConnectors }: { xConnectors: XConnector[] }) {
    super('ICON', xConnectors);
  }
}
