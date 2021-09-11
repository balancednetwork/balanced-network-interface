import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class BALN extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].baln;
  }

  balanceOf(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  swap(value: BigNumber, outputSymbol: string, minimumReceive: BigNumber) {
    const data = {
      method: '_swap',
      params: { toToken: addresses[this.nid][outputSymbol.toLowerCase()], minimumReceive: minimumReceive.toFixed() },
    };

    return this.transfer(addresses[this.nid].dex, value, JSON.stringify(data));
  }

  transfer(to: string, value: BigNumber, data?: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHex(value),
        _data: data && IconConverter.toHex(data),
      },
    });

    return this.callICONPlugins(callParams);
  }

  stake(value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'stake',
      params: {
        _value: IconConverter.toHex(value),
      },
    });

    return this.callICONPlugins(payload);
  }

  deposit(value: BigNumber) {
    return this.transfer(addresses[this.nid].dex, value, JSON.stringify({ method: '_deposit' }));
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

  totalSupply() {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
    });

    return this.call(callParams);
  }
}
