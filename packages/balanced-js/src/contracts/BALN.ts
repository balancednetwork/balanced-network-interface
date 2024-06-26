import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class BALN extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].baln;
  }

  stake(value: string) {
    const payload = this.transactionParamsBuilder({
      method: 'stake',
      params: {
        _value: IconConverter.toHexNumber(value),
      },
    });

    return this.callICONPlugins(payload);
  }

  detailsBalanceOf(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'detailsBalanceOf',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  availableBalanceOf(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'availableBalanceOf',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  stakedBalanceOfAt(_account: string, _day: number) {
    const callParams = this.paramsBuilder({
      method: 'stakedBalanceOfAt',
      params: {
        _account: _account,
        _day: IconConverter.toHex(_day),
      },
    });

    return this.call(callParams);
  }

  totalStakedBalanceOfAt(_day: number) {
    const callParams = this.paramsBuilder({
      method: 'totalStakedBalanceOfAt',
      params: {
        _day: IconConverter.toHex(_day),
      },
    });

    return this.call(callParams);
  }

  totalStakedBalance() {
    const callParams = this.paramsBuilder({
      method: 'totalStakedBalance',
    });

    return this.call(callParams);
  }

  createLock(to: string, value: string, unlockTime: number) {
    const transferData = JSON.stringify({
      method: 'createLock',
      params: {
        unlockTime: unlockTime * 1000,
      },
    });

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHexNumber(value),
        _data: transferData && IconConverter.toHex(transferData),
      },
    });

    return this.callICONPlugins(payload);
  }

  increaseAmount(to: string, value: string, unlockTime: number) {
    const transferData = JSON.stringify({
      method: 'increaseAmount',
      params: {
        unlockTime: unlockTime * 1000,
      },
    });

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHexNumber(value),
        _data: transferData && IconConverter.toHex(transferData),
      },
    });

    return this.callICONPlugins(payload);
  }
}
