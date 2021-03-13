import { nid, AccountType } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class Rewards extends IconWrapper {
  constructor(public account: AccountType) {
    super(nid);
    this.address = addresses[this.nid].rewards;
  }

  getClaimRewardsTransactionPayload() {
    return this.transactionParamsBuilder({
      method: 'claimRewards',
    });
  }
}
