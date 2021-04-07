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

    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(payload.params);
    }

    return this.callIconex(payload);
  }

  addCollateral(value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'addCollateral',
      value: value,
    });

    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(payload.params);
    }

    return this.callIconex(payload);
  }

  originateLoan(asset: string = 'bnUSD', value: BigNumber, from: string) {
    const payload = this.transactionParamsBuilder({
      method: 'originateLoan',
      params: { _asset: asset, _amount: IconConverter.toHex(value), _from: from },
    });

    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(payload.params);
    }

    return this.callIconex(payload);
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
}
