import { XService } from '@/xwagmi/core/XService';
import { IconHanaXConnector } from './IconHanaXConnector';

export class IconXService extends XService {
  constructor() {
    super('ICON');
  }

  getXConnectors() {
    return [new IconHanaXConnector()];
  }
}
