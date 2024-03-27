import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class NOL extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].nol;
  }

  getOrders() {
    const callParams = this.paramsBuilder({
      method: 'getOrders',
    });

    return this.call(callParams);
  }

  getInvestedEmissions(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getInvestedEmissions',
      blockHeight: blockHeight,
    });

    return this.call(callParams);
  }
}
