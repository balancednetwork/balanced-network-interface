import BigNumber from 'bignumber.js';

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

  stakeICX(value: BigNumber) {
    const payload = this.transactionParamsBuilder({
      method: 'stakeICX',
      value: value.integerValue(BigNumber.ROUND_DOWN),
      params: {
        _to: this.account,
      },
    });

    return this.callIconex(payload);
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
