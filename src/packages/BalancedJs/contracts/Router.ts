import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Router extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].router;
  }

  swapICX(value: string, path: (string | null)[], minimumReceive: string) {
    const payload = this.transactionParamsBuilder({
      method: 'route',
      value: value,
      params: {
        _path: path,
        _minReceive: minimumReceive,
      },
    });

    return this.callICONPlugins(payload);
  }
}
