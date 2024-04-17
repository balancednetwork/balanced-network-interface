import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class BalancedOracle extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].balancedOracle;
  }

  getLastPriceInLoop(symbol: string) {
    const payload = this.paramsBuilder({
      method: 'getLastPriceInLoop',
      params: {
        symbol: symbol,
      },
    });

    return this.call(payload);
  }
}
