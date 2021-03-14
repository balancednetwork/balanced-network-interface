import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export type CollateralMethod = 'withdrawCollateral' | 'addCollateral';

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  /**
   * addCollateral and withdrawCollateral
   * @returns payload to call iconex
   */
  getCollateralTransactionPayload({
    value,
    params,
    method,
  }: {
    method: CollateralMethod;
    value: number;
    params: {
      [key: string]: any;
    };
  }) {
    return this.transactionParamsBuilder({
      method,
      value,
      params,
    });
  }

  getAvailableAssets() {
    const callParams = this.paramsBuilder({
      method: 'getAvailableAssets',
    });

    return this.call(callParams);
  }

  getAccountPositions() {
    const callParams = this.paramsBuilder({
      method: 'getAccountPositions',
      params: {
        _owner: this.account,
      },
    });

    return this.call(callParams);
  }
}
