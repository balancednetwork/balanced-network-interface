import { nid } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class Rewards extends IconWrapper {
  constructor(public account: string) {
    super(nid);
    this.address = addresses[this.nid].rewards;
  }

  getClaimRewardsTransactionPayload() {
    return this.transactionParamsBuilder({
      method: 'claimRewards',
    });
  }
}
