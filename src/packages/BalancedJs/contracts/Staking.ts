import BigNumber from 'bignumber.js';
import { IconAmount } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Staking extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].staking;
  }

  getTodayRate() {
    const callParams = this.paramsBuilder({
      method: 'getTodayRate',
    });

    return this.call(callParams);
  }

  stakeICX(to: string, value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'stakeICX',
      value: IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop(),
      params: {
        _to: to,
      },
    });

    return this.callICONPlugins(payload);
  }

  getUserUnstakeInfo(address: string) {
    const callParams = this.paramsBuilder({
      method: 'getUserUnstakeInfo',
      params: {
        _address: address,
      },
    });

    return this.call(callParams);
  }
}
