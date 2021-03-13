import { IconConverter } from 'icon-sdk-js';

import { nid, AccountType } from '.';
import addresses from '../../constants/addresses';
import { BALNbnUSDpoolId, sICXbnUSDpoolId } from '../icon-react';
import { IconWrapper } from './iconWrapper';

export enum GetPriceDexPID {
  BALNbnUSDpool = BALNbnUSDpoolId,
  sICXbnUSDpool = sICXbnUSDpoolId,
}

export class Dex extends IconWrapper {
  constructor(public account: AccountType) {
    super(nid);
    this.address = addresses[this.nid].dex;
  }

  getPrice(params: { _pid: GetPriceDexPID }) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: {
        _pid: params._pid.toString(),
      },
    });

    return this.call(callParams);
  }

  balanceOf() {
    console.log('IconConverter.toNumber', IconConverter.toNumber(addresses[this.nid].bal));
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: { _owner: this.account, _id: addresses[this.nid].bal },
    });

    return this.call(callParams);
  }
}
