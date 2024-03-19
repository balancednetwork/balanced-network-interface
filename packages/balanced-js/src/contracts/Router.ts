import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Router extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].router;
  }

  swapICX(value: string, path: (string | null)[], minimumReceive: string, receiver?: string) {
    const payload = this.transactionParamsBuilder({
      method: 'route',
      value: IconConverter.toHexNumber(value),
      params: {
        _path: path,
        _minReceive: IconConverter.toHexNumber(minimumReceive),
        ...(receiver && { _receiver: receiver })
      },
    });

    return this.callICONPlugins(payload);
  }
}
