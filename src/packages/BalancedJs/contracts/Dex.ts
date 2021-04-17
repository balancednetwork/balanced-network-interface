import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dex extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dex;
  }

  getPrice(pid: number) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: {
        _pid: IconConverter.toHex(pid),
      },
    });

    return this.call(callParams);
  }

  add(baseToken: string, quoteToken: string, maxBaseValue: BigNumber, quoteValue: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'add',
      params: {
        _baseToken: baseToken,
        _quoteToken: quoteToken,
        _maxBaseValue: IconConverter.toHex(maxBaseValue),
        _quoteValue: IconConverter.toHex(quoteValue),
      },
    });

    return this.callIconex(payload);
  }

  balanceOf(owner: string, pid: number) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: owner,
        _id: IconConverter.toHex(pid),
      },
    });
    return this.call(callParams);
  }

  totalSupply(pid: number) {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
      params: {
        _pid: IconConverter.toHex(pid),
      },
    });

    return this.call(callParams);
  }

  getPoolTotal(pid: number, token: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolTotal',
      params: {
        _pid: IconConverter.toHex(pid),
        _token: token,
      },
    });

    return this.call(callParams);
  }

  transferICX(value: BigNumber) {
    const payload = this.transferICXParamsBuilder({
      value: value,
    });

    return this.callIconex(payload);
  }

  getICXWithdrawLock() {
    const callParams = this.paramsBuilder({
      method: 'getICXWithdrawLock',
    });

    return this.call(callParams);
  }

  cancelSicxIcxOrder() {
    const payload = this.transactionParamsBuilder({
      method: 'cancelSicxicxOrder',
    });

    return this.callIconex(payload);
  }

  // This method can withdraw up to a user's holdings in a pool, but it cannot
  // be called if the user has not passed their withdrawal lock time period.
  remove(pid: number, value: BigNumber, withdraw: number = 1) {
    const payload = this.transactionParamsBuilder({
      method: 'remove',
      params: {
        _pid: IconConverter.toHex(pid),
        _value: IconConverter.toHex(value),
        _withdraw: IconConverter.toHex(withdraw),
      },
    });
    return this.callIconex(payload);
  }

  getFees() {
    const callParams = this.paramsBuilder({
      method: 'getFees',
    });

    return this.call(callParams);
  }

  isEarningRewards(address: string, id: number) {
    const callParams = this.paramsBuilder({
      method: 'isEarningRewards',
      params: {
        _address: address,
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  withdraw(token: string, value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'withdraw',
      params: {
        _token: token,
        _value: IconConverter.toHex(value),
      },
    });

    return this.callIconex(payload);
  }

  getICXBalance(address: string) {
    const callParams = this.paramsBuilder({
      method: 'getICXBalance',
      params: {
        _address: address,
      },
    });

    return this.call(callParams);
  }
}
