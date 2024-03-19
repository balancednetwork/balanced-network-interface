import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import { Contract } from './contract';

export default class IRC2 extends Contract {
  name() {
    const callParams = this.paramsBuilder({
      method: 'name',
    });

    return this.call(callParams);
  }

  symbol() {
    const callParams = this.paramsBuilder({
      method: 'symbol',
    });

    return this.call(callParams);
  }

  decimals() {
    const callParams = this.paramsBuilder({
      method: 'decimals',
    });

    return this.call(callParams);
  }

  balanceOf(owner: string, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      blockHeight: blockHeight,
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

  deposit(value: string) {
    return this.transfer(addresses[this.nid].dex, value, JSON.stringify({ method: '_deposit' }));
  }

  totalSupply(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
      blockHeight: blockHeight,
    });

    return this.call(callParams);
  }

  swapUsingRoute(value: string, outputAddress: string, minimumReceive: string, path: (string | null)[], receiver?: string) {
    const data = {
      method: '_swap',
      params: {
        toToken: outputAddress,
        // this should be decimal
        minimumReceive: minimumReceive,
        path: path,
        ...(receiver && { receiver: receiver })
      },
    };

    return this.transfer(addresses[this.nid].router, value, JSON.stringify(data));
  }

  transfer(to: string, value: string, data?: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHexNumber(value),
        _data: data && IconConverter.toHex(data),
      },
    });

    return this.callICONPlugins(callParams);
  }
  
  crossTransfer(_to: string, _value: string, fee: string) {
    const payload = this.transactionParamsBuilder({
      method: 'crossTransfer',
      value: IconConverter.toHexNumber(fee),
      params: {
        _to,
        _value: IconConverter.toHexNumber(_value),
      }
    });

    return this.callICONPlugins(payload);
  }
}
