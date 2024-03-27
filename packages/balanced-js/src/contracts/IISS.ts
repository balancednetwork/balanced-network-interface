import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class IISS extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = 'cx0000000000000000000000000000000000000000';
  }

  getIISSInfo() {
    const callParams = this.paramsBuilder({
      method: 'getIISSInfo',
    });

    return this.call(callParams);
  }

  getPReps() {
    const callParams = this.paramsBuilder({
      method: 'getPReps',
    });

    return this.call(callParams);
  }

  getNetworkInfo() {
    const callParams = this.paramsBuilder({
      method: 'getNetworkInfo',
    });

    return this.call(callParams);
  }
}
