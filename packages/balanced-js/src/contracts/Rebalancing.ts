import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Rebalancing extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].rebalancing;
  }

  getPriceChangeThreshold() {
    const payload = this.paramsBuilder({
      method: 'getPriceChangeThreshold',
    });

    return this.call(payload);
  }

  getRebalancingStatus() {
    const payload = this.paramsBuilder({
      method: 'getRebalancingStatus',
    });

    return this.call(payload);
  }

  rebalance() {
    const payload = this.transactionParamsBuilder({
      method: 'rebalance',
    });

    return this.callICONPlugins(payload);
  }
}
