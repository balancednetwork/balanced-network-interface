import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class ICXBurner extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].icxBurner;
  }

  getBurnedAmount(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getBurnedAmount',
      blockHeight: blockHeight,
    });

    return this.call(callParams);
  }

  getPendingBurn() {
    const callParams = this.paramsBuilder({
      method: 'getPendingBurn',
    });

    return this.call(callParams);
  }

  getUnstakingBurn() {
    const callParams = this.paramsBuilder({
      method: 'getUnstakingBurn',
    });

    return this.call(callParams);
  }
}
