import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export enum Collateral {
  withdrawCollateral = 'withdrawCollateral',
  addCollateral = 'addCollateral',
}

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  collateral({
    account,
    value,
    params,
    method,
  }: {
    method: Collateral;
    account: string;
    value: number;
    params: {
      [key: string]: any;
    };
  }) {
    return this.transactionParamsBuilder({
      account,
      method,
      value,
      params,
    });
  }

  getAvailableAssets({ account }: { account: string }) {
    const callParams = this.paramsBuilder({
      account,
      method: 'getAvailableAssets',
    });

    return this.call(callParams);
  }

  getAccountPositions({ account }: { account: string }) {
    const callParams = this.paramsBuilder({
      account,
      method: 'getAccountPositions',
      params: {
        _owner: account,
      },
    });

    return this.call(callParams);
  }
}
