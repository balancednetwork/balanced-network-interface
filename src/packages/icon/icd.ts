import { nid } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class Icd extends IconWrapper {
  constructor(public account: string) {
    super(nid);
    this.address = addresses[this.nid].icd;
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

  totalSupply() {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
    });

    return this.call(callParams);
  }
}
