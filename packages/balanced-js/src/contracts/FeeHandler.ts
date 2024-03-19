import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class FeeHandler extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].feeHandler;
  }

  getLoanFeesAccrued(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getLoanFeesAccrued',
      blockHeight: blockHeight,
    });

    return this.call(callParams);
  }

  getStabilityFundFeesAccrued(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getStabilityFundFeesAccrued',
      blockHeight: blockHeight,
    });

    return this.call(callParams);
  }

  getSwapFeesAccruedByToken(token: string, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getSwapFeesAccruedByToken',
      blockHeight: blockHeight,
      params: { token },
    });

    return this.call(callParams);
  }

  getTokensForSwapFees() {
    const callParams = this.paramsBuilder({
      method: 'get_allowed_address',
    });

    return this.call(callParams);
  }
}
