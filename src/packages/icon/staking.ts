import { nid } from '.';
import addresses from '../../constants/addresses';
import { BALNbnUSDpoolId } from '../icon-react';
import { IconWrapper } from './iconWrapper';

export class Staking extends IconWrapper {
  constructor(public account: string) {
    super(nid);
    this.address = addresses[this.nid].staking;
  }

  getTodayRate() {
    const callParams = this.paramsBuilder({
      method: 'getTodayRate',
      params: { _pid: BALNbnUSDpoolId.toString() },
    });

    return this.call(callParams);
  }
}
