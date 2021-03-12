import addresses, { NetworkId } from '../../constants/address';
import { IconWrapper } from './iconWrapper';

export class SICX extends IconWrapper {
  constructor() {
    super(NetworkId.YEOUIDO);
    this.address = addresses[this.nid].sicx;
  }

  balanceOf({ account }: { account: string }) {
    const callParams = this.paramsBuilder({
      account,
      method: 'balanceOf',
      params: {
        _owner: account,
      },
    });

    return this.call(callParams);
  }
}
