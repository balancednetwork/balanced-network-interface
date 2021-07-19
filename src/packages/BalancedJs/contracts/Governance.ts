import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Governance extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].governance;
  }

  checkVote(voteIndex: number) {
    const callParams = this.paramsBuilder({
      method: 'checkVote',
      params: {
        _vote_index: IconConverter.toHex(voteIndex),
      },
    });

    return this.call(callParams);
  }

  getVotesOfUser(voteIndex: number, user: string) {
    const callParams = this.paramsBuilder({
      method: 'getVotesOfUser',
      params: {
        vote_index: IconConverter.toHex(voteIndex),
        user: user,
      },
    });

    return this.call(callParams);
  }

  getDay() {
    const callParams = this.paramsBuilder({
      method: 'getDay',
    });

    return this.call(callParams);
  }

  castVote(name: string, vote: boolean) {
    const callParams = this.transactionParamsBuilder({
      method: 'castVote',
      params: {
        name: name,
        vote: IconConverter.toHex(vote ? 1 : 0),
      },
    });

    return this.callICONPlugins(callParams);
  }
}
