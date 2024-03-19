import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Rewards extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].rewards;
  }

  claimRewards() {
    const payload = this.transactionParamsBuilder({
      method: 'claimRewards',
    });

    return this.callICONPlugins(payload);
  }

  getBalnHolding(holder: string) {
    const payload = this.paramsBuilder({
      method: 'getBalnHolding',
      params: {
        _holder: holder,
      },
    });

    return this.call(payload);
  }

  getRecipientsSplit() {
    const payload = this.paramsBuilder({
      method: 'getRecipientsSplit',
    });

    return this.call(payload);
  }

  getEmission(day?: number) {
    const payload = this.paramsBuilder({
      method: 'getEmission',
      params: {
        _day: day && IconConverter.toHex(day),
      },
    });

    return this.call(payload);
  }

  getAPY(name: string) {
    const payload = this.paramsBuilder({
      method: 'getAPY',
      params: {
        _name: name,
      },
    });

    return this.call(payload);
  }
  
  getBoostData(address: string, sources?: string[]) {
    const payload = this.paramsBuilder({
      method: `getBoostData`,
      params: {
        user: address,
        sources: sources
      }
    });

    return this.call(payload);
  }

  getDistributionPercentages() {
    const payload = this.paramsBuilder({
      method: 'getDistributionPercentages'
    });

    return this.call(payload);
  }

  getSourceVoteData() {
    const payload = this.paramsBuilder({
      method: 'getSourceVoteData',
    });

    return this.call(payload);
  }

  getUserSlope(user: string, source: string) {
    const payload = this.paramsBuilder({
      method: `getUserSlope`,
      params: {
        user,
        source,
      }
    });

    return this.call(payload);
  }

  getLastUserVote(user: string, source: string) {
    const payload = this.paramsBuilder({
      method: `getLastUserVote`,
      params: {
        user,
        source,
      }
    });

    return this.call(payload);
  }

  getUserVoteData(user: string) {
    const payload = this.paramsBuilder({
      method: `getUserVoteData`,
      params: {
        user,
      }
    });

    return this.call(payload);
  }

  voteForSource(name: string, userWeight: number) {
    const payload = this.transactionParamsBuilder({
      method: 'voteForSource',
      params: {
        name,
        userWeight: IconConverter.toHex(userWeight),
      }
    });

    return this.callICONPlugins(payload);
  }

  getWeightsSumPerType(type: number) {
    const payload = this.paramsBuilder({
      method: `getWeightsSumPerType`,
      params: {
        typeId: IconConverter.toHex(type),
      }
    });

    return this.call(payload);
  }
}
