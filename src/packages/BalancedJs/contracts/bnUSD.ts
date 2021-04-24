import BigNumber from 'bignumber.js';
import { IconAmount, IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class bnUSD extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bnusd;
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

  deposit(value: BigNumber) {
    return this.transfer(addresses[this.nid].dex, value, JSON.stringify({ method: '_deposit' }));
  }

  totalSupply() {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
    });

    return this.call(callParams);
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

  swapToOutputCurrency(value: BigNumber, outputSymbol: string, slippage: string) {
    const data = {
      method: '_swap',
      params: {
        toToken: addresses[this.nid][outputSymbol.toLowerCase()],
        maxSlippage: slippage,
      },
    };

    return this.transfer(
      addresses[this.nid].dex,
      IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop(),
      JSON.stringify(data),
    );
  }
}
