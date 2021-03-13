import { nid } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export enum Collateral {
  withdrawCollateral = 'withdrawCollateral',
  addCollateral = 'addCollateral',
}

export class Loans extends IconWrapper {
  constructor(public account: string) {
    super(nid);
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
    method: Collateral;
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
