import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Trickler extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].trickler;
  }

  getDistributionPeriod() {
    const callParams = this.paramsBuilder({
      method: 'getDistributionPeriod',
    });

    return this.call(callParams);
  }

  getAllowListTokens() {
    const callParams = this.paramsBuilder({
      method: 'getAllowListTokens',
    });

    return this.call(callParams);
  }

  getRewards() {
    const callParams = this.paramsBuilder({
      method: 'getRewards',
    });

    return this.call(callParams);
  }
}
