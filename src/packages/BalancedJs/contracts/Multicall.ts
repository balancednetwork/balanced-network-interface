import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Multicall extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].multicall;
  }

  getPoolStatsForPair(base: string, quote: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolStatsForPair',
      params: {
        _base: base,
        _quote: quote,
      },
    });

    return this.call(callParams);
  }
}
