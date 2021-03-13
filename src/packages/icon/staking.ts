import { nid, AccountType } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class Staking extends IconWrapper {
  constructor(public account: AccountType) {
    super(nid);
    this.address = addresses[this.nid].staking;
  }

  getTodayRate() {
    const callParams = this.paramsBuilder({
      method: 'getTodayRate',
    });

    return this.call(callParams);
  }
}
