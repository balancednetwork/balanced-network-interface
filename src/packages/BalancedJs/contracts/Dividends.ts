import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dividends extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dividends;
  }

  getBalances() {
    const payload = this.paramsBuilder({
      method: 'getBalances',
    });

    return this.call(payload);
  }
}
