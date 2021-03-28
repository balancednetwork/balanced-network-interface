import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Rewards extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].rewards;
  }

  claimRewards() {
    const payload = this.transactionParamsBuilder({
      method: 'claimRewards',
      value: 0,
    });

    return this.callIconex(payload);
  }

  getRewards() {
    const payload = this.paramsBuilder({
      method: 'getBalnHolding',
      params: {
        _holder: this.account,
      },
    });

    return this.callIconex(payload);
  }
}
