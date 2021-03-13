import { nid, AccountType } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class SICX extends IconWrapper {
  constructor(public account: AccountType) {
    super(nid);
    this.address = addresses[this.nid].sicx;
  }

  balanceOf() {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: this.account,
      },
    });

    return this.call(callParams);
  }
}
