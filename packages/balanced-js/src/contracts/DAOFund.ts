import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class DAOFund extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].daofund;
  }

  getBalances() {
    const payload = this.paramsBuilder({
      method: 'getBalances',
    });

    return this.call(payload);
  }

  getBalnEarnings(blockHeight?: number) {
    const payload = this.paramsBuilder({
      method: 'getBalnEarnings',
      blockHeight: blockHeight,
    });

    return this.call(payload);
  }

  getFeeEarnings(blockHeight?: number) {
    const payload = this.paramsBuilder({
      method: 'getFeeEarnings',
      blockHeight: blockHeight,
    });

    return this.call(payload);
  }
}
