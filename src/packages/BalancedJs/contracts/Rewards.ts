import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Rewards extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].rewards;
  }

  async claimRewards() {
    const payload = this.transactionParamsBuilder({
      method: 'claimRewards',
    });

    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(payload.params);
    }

    return this.callIconex(payload);
  }

  getBalnHolding(holder: string) {
    const payload = this.paramsBuilder({
      method: 'getBalnHolding',
      params: {
        _holder: holder,
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

  getEmission(day?: number) {
    const payload = this.paramsBuilder({
      method: 'getEmission',
      params: {
        _day: day && IconConverter.toHex(day),
      },
    });

    return this.call(payload);
  }

  getAPY(name: string) {
    const payload = this.paramsBuilder({
      method: 'getAPY',
      params: {
        _name: name,
      },
    });

    return this.call(payload);
  }
}
