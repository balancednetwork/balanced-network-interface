import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dex extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dex;
  }

  getPrice(params: { _pid: string }) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params,
    });

    return this.call(callParams);
  }
}
