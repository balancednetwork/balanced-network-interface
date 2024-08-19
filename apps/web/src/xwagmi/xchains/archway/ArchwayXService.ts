import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';

export class ArchwayXService extends XService {
  constructor({ xConnectors }: { xConnectors: XConnector[] }) {
    super('ARCHWAY', xConnectors);
  }
}
