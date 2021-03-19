import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Baln extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].baln;
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

  getLiquidityBALNSupply() {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: this.account,
        _id: this.address,
      },
    });

    return this.call(callParams);
  }
}
