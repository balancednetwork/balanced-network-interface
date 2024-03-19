import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Bribe extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bribe;
  }

  getActivePeriod(source: string, bribeToken: string) {
    const payload = this.paramsBuilder({
      method: 'getActivePeriod',
      params: {
        source,
        bribeToken
      }
    });

    return this.call(payload);
  }

  bribesPerSource(source: string) {
    const payload = this.paramsBuilder({
      method: 'bribesPerSource',
      params: {
        source
      }
    });

    return this.call(payload);
  }
  
  getTotalBribes(source: string, bribeToken: string) {
    const payload = this.paramsBuilder({
      method: 'getTotalBribes',
      params: {
        source,
        bribeToken
      }
    });

    return this.call(payload);
  }
  
  getClaimedBribes(source: string, bribeToken: string) {
    const payload = this.paramsBuilder({
      method: 'getClaimedBribes',
      params: {
        source,
        bribeToken
      }
    });

    return this.call(payload);
  }
  
  getFutureBribe(source: string, bribeToken: string, period: number) {
    const payload = this.paramsBuilder({
      method: 'getFutureBribe',
      params: {
        source,
        bribeToken,
        period: `${period}`
      }
    });

    return this.call(payload);
  }
  
  claimable(user: string, source: string, bribeToken: string) {
    const payload = this.paramsBuilder({
      method: 'claimable',
      params: {
        user,
        source,
        bribeToken
      }
    });

    return this.call(payload);
  }


  claimBribe(source: string, bribeToken: string) {
    const payload = this.transactionParamsBuilder({
      method: 'claimBribe',
      params: {
        source,
        bribeToken
      }
    });

    return this.callICONPlugins(payload);
  }
}
