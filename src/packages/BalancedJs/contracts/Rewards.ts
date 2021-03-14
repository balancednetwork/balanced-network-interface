import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export class Rewards extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  getClaimRewardsTransactionPayload() {
    return this.transactionParamsBuilder({
      method: 'claimRewards',
    });
  }
}
