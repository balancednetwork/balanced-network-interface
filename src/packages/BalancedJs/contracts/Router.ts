import BigNumber from 'bignumber.js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Router extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].router;
  }

  swapICX(value: BigNumber, path: (string | null)[]) {
    const payload = this.transactionParamsBuilder({
      method: 'route',
      value: value,
      params: {
        _path: path,
      },
    });

    return this.callICONPlugins(payload);
  }
}
