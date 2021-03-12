import addresses, { NetworkId } from '../../constants/address';
import { IconWrapper } from './iconWrapper';

export enum Collateral {
  withdrawCollateral = 'withdrawCollateral',
  addCollateral = 'addCollateral',
}

export class Loans extends IconWrapper {
  constructor() {
    super(NetworkId.YEOUIDO);
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
