import { Converter as IconConverter } from 'icon-sdk-js';

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

  getUserDividends(account: string, start: number = 0, end: number = 0) {
    const payload = this.paramsBuilder({
      method: 'getUserDividends',
      params: {
        _account: account,
        _start: IconConverter.toHex(start),
        _end: IconConverter.toHex(end),
      },
    });

    return this.call(payload);
  }

  claim(start: number = 0, end: number = 0) {
    const payload = this.transactionParamsBuilder({
      method: 'claim',
      params: {
        _start: IconConverter.toHex(start),
        _end: IconConverter.toHex(end),
      },
    });

    return this.callICONPlugins(payload);
  }

  getDividendsPercentage() {
    const payload = this.paramsBuilder({
      method: 'getDividendsPercentage',
    });

    return this.call(payload);
  }

  claimDividends() {
    const payload = this.transactionParamsBuilder({
      method: 'claimDividends',
    });

    return this.callICONPlugins(payload);
  }

  getUnclaimedDividends(account: string) {
    const payload = this.paramsBuilder({
      method: 'getUnclaimedDividends',
      params: {
        user: account,
      }
    });

    return this.call(payload);
  }
}
