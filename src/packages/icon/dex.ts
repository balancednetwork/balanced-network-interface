import { nid } from '.';
import addresses from '../../constants/addresses';
import { BALNbnUSDpoolId, sICXbnUSDpoolId } from '../icon-react';
import { IconWrapper } from './iconWrapper';

export enum GetPriceDexPID {
  BALNbnUSDpool = BALNbnUSDpoolId,
  sICXbnUSDpool = sICXbnUSDpoolId,
}

export class Dex extends IconWrapper {
  constructor(public account: string) {
    super(nid);
    this.address = addresses[this.nid].dex;
  }

  getPrice({ params }: { params: { _pid: GetPriceDexPID } }) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: {
        _pid: params._pid.toString(),
      },
    });

    return this.call(callParams);
  }

  balanceOf() {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: { _owner: this.account, _id: addresses[this.nid].bal },
    });

    return this.call(callParams);
  }
}
