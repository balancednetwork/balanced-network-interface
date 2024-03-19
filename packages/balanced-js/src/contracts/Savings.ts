import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Savings extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].savings;
  }

  getLockedAmount(user: string) {
    const payload = this.paramsBuilder({
      method: 'getLockedAmount',
      params: {
        user
      }
    });

    return this.call(payload);
  }

  getUnclaimedRewards(user: string) {
    const payload = this.paramsBuilder({
      method: 'getUnclaimedRewards',
      params: {
        user
      }
    });

    return this.call(payload);
  }

  unlock(amount: string) {
    const payload = this.transactionParamsBuilder({
      method: 'unlock',
      params: {
        amount: IconConverter.toHexNumber(amount)
      }
    });

    return this.callICONPlugins(payload);
  }

  claimRewards() {
    const payload = this.transactionParamsBuilder({
      method: 'claimRewards',
      params: {}
    });

    return this.callICONPlugins(payload);
  }

  getTotalPayout(token: string, blockHeight?: number) {
    const payload = this.paramsBuilder({
      method: 'getTotalPayout',
      blockHeight: blockHeight,
      params: {
        token
      }
    });

    return this.call(payload);
  }
}
