import { Converter as IconConverter } from 'icon-sdk-js';

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

  stakeICX(to: string, value: string) {
    const payload = this.transactionParamsBuilder({
      method: 'stakeICX',
      value: IconConverter.toHexNumber(value),
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

  getClaimableICX(address: string) {
    const callParams = this.paramsBuilder({
      method: 'claimableICX',
      params: {
        _address: address,
      },
    });

    return this.call(callParams);
  }

  claimICX() {
    const callParams = this.transactionParamsBuilder({
      method: 'claimUnstakedICX',
    });
    return this.callICONPlugins(callParams);
  }
}
