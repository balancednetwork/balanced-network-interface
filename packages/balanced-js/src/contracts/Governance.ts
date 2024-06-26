import { Converter as IconConverter } from 'icon-sdk-js';

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

  castVote(voteIndex: number, vote: boolean) {
    const callParams = this.transactionParamsBuilder({
      method: 'castVote',
      params: {
        vote_index: IconConverter.toHex(voteIndex),
        vote: IconConverter.toHex(vote ? 1 : 0),
      },
    });

    return this.callICONPlugins(callParams);
  }

  getTotalProposal() {
    const callParams = this.paramsBuilder({
      method: 'getProposalCount',
    });
    return this.call(callParams);
  }

  getProposals(offset: number, batch_size: number) {
    const callParams = this.paramsBuilder({
      method: 'getProposals',
      params: {
        batch_size: IconConverter.toHex(batch_size),
        offset: IconConverter.toHex(offset),
      },
    });
    return this.call(callParams);
  }

  myVotingWeight(address: string, block: number) {
    const callParams = this.paramsBuilder({
      method: 'myVotingWeight',
      params: {
        _address: address,
        block: IconConverter.toHex(block),
      },
    });

    return this.call(callParams);
  }

  defineVote(
    name: string,
    description: string,
    vote_start: number,
    duration: number,
    forumLink: string,
    transactions?: string,
  ) {
    const callParams = this.transactionParamsBuilder({
      method: 'defineVote',
      params: {
        name: name,
        description: description,
        vote_start: IconConverter.toHex(vote_start),
        duration: IconConverter.toHex(duration),
        forumLink: forumLink,
        transactions: transactions ?? null,
      },
    });

    return this.callICONPlugins(callParams);
  }

  getBalnVoteDefinitionCriterion() {
    const callParams = this.paramsBuilder({
      method: 'getBalnVoteDefinitionCriterion',
    });

    return this.call(callParams);
  }

  tryExecuteTransactions(transactions: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'tryExecuteTransactions',
      params: {
        transactions,
      },
    });

    return this.callICONPlugins(callParams);
  }
}
