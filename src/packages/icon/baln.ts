import addresses, { NetworkId } from '../../constants/address';
import { IconWrapper } from './iconWrapper';

export class BALN extends IconWrapper {
  constructor() {
    super(NetworkId.YEOUIDO);
    this.address = addresses[this.nid].bal;
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

  getLiquidityBALNSupply({ account }: { account: string }) {
    const callParams = this.paramsBuilder({
      account,
      method: 'balanceOf',
      params: {
        _owner: account,
        _id: this.address,
      },
    });

    return this.call(callParams);
  }
}
