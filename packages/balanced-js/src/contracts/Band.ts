import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Band extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].band;
  }

  getReferenceData(params: { _base: string; _quote: string }) {
    const callParams = this.paramsBuilder({
      method: 'get_reference_data',
      params,
    });

    return this.call(callParams);
  }
}
