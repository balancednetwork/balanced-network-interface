import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  withdrawCollateral(value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawCollateral',
      params: { _value: IconConverter.toHex(value) },
    });

    return this.callICONPlugins(payload);
  }

  depositAndBorrow(
    value: BigNumber,
    params: { asset?: 'bnUSD'; amount?: BigNumber; from?: string; value?: BigNumber } = {},
  ) {
    const payload = this.transactionParamsBuilder({
      method: 'depositAndBorrow',
      value: value,
      params: {
        _asset: params.asset,
        _amount: params.amount && IconConverter.toHex(params.amount),
        _from: params.from,
        _value: params.value && IconConverter.toHex(params.value),
      },
    });

    return this.callICONPlugins(payload);
  }

  returnAsset(symbol: string, value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'returnAsset',
      params: {
        _symbol: symbol,
        _value: IconConverter.toHex(value),
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
