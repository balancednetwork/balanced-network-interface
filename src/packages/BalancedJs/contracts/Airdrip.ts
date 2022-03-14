import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Airdrip extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].airdrip;
  }

  getTokensDetails() {
    const callParams = this.paramsBuilder({
      method: 'getTokensDetails',
    });

    return this.call(callParams);
  }

  getStartTimestamp() {
    const callParams = this.paramsBuilder({
      method: 'getStartTimestamp',
    });

    return this.call(callParams);
  }

  getAirdripDuration() {
    const callParams = this.paramsBuilder({
      method: 'getAirdripDuration',
    });

    return this.call(callParams);
  }

  claimToken(index: number, totalVotes: number, proofHash: Array<string>, tokenAddress: string) {
    const payload = this.transactionParamsBuilder({
      method: 'claimToken',
      params: {
        proofHash: proofHash,
        index: IconConverter.toHex(index),
        total_votes: totalVotes.toString(),
        tokenAddress: tokenAddress,
      },
    });

    return this.callICONPlugins(payload);
  }
}
