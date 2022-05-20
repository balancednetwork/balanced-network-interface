import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  withdrawCollateral(value: string) {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawCollateral',
      params: { _value: IconConverter.toHexNumber(value) },
    });

    return this.callICONPlugins(payload);
  }

  depositAndBorrow(value: string, params: { asset?: 'bnUSD'; amount?: string; from?: string; value?: string } = {}) {
    const payload = this.transactionParamsBuilder({
      method: 'depositAndBorrow',
      value: IconConverter.toHexNumber(value),
      params: {
        _asset: params.asset,
        _amount: params.amount && IconConverter.toHexNumber(params.amount),
        _from: params.from,
        _value: params.value && IconConverter.toHexNumber(params.value),
      },
    });

    return this.callICONPlugins(payload);
  }

  returnAsset(symbol: string, value: string, repay: number) {
    const payload = this.transactionParamsBuilder({
      method: 'returnAsset',
      params: {
        _symbol: symbol,
        _value: IconConverter.toHexNumber(value),
        _repay: IconConverter.toHex(repay),
      },
    });

    return this.callICONPlugins(payload);
  }

  getAvailableAssets() {
    const callParams = this.paramsBuilder({
      method: 'getAvailableAssets',
    });

    return this.call(callParams);
  }

  getAccountPositions(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'getAccountPositions',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  getParameters() {
    const callParams = this.paramsBuilder({
      method: 'getParameters',
    });

    return this.call(callParams);
  }
}
