import BigNumber from 'bignumber.js';

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

    return this.call(payload);
  }

  getRecipientsSplit() {
    const payload = this.paramsBuilder({
      method: 'getRecipientsSplit',
    });

    return this.call(payload);
  }

  getEmission(day: BigNumber) {
    const payload = this.paramsBuilder({
      method: 'getEmission',
      params: {
        _day: day.toString(),
      },
    });

    return this.call(payload);
  }
}
