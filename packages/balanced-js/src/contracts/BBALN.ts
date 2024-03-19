import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class BBALN extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bbaln;
  }

  getLocked(account: string) {
    const payload = this.paramsBuilder({
      method: 'getLocked',
      params: {
        _owner: account
      }
    });

    return this.call(payload);
  }

  balanceOf(account: string, timestamp: string = '0') {
    const payload = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: account,
        timestamp: timestamp
      }
    });

    return this.call(payload);
  }

  withdraw() {
    const payload = this.transactionParamsBuilder({
      method: 'withdraw',
    });

    return this.callICONPlugins(payload);
  }
  
  withdrawEarly() {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawEarly',
    });

    return this.callICONPlugins(payload);
  }

  increaseUnlockTime(unlockTime: number) {
    const payload = this.transactionParamsBuilder({
      method: 'increaseUnlockTime',
      params: {
        unlockTime: IconConverter.toHex(unlockTime * 1000),
      },
    });

    return this.callICONPlugins(payload);
  }

  getTotalLocked() {
    const payload = this.paramsBuilder({
      method: 'getTotalLocked',
    });
    
    return this.call(payload);
  }

  totalSupply(timestamp?: number) {
    const payload = this.paramsBuilder({
      method: 'totalSupply',
      params: {
        time: timestamp ? `${timestamp}000` : '0',
      }
    })

    return this.call(payload);
  }

  activeUsersCount() {
    const payload = this.paramsBuilder({
      method: 'activeUsersCount',
    });
    
    return this.call(payload);
  }
}
