import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export interface CallData {
  target: string;
  method: string;
  params: string[];
}

export const MULTICALL_POOL = 'cx75256fadf232ad1124d9c6cd70c9b1ec122a0f47';

export default class Multicall extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].multicall;
  }

  getPoolStatsForPair(base: string, quote: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolStatsForPair',
      params: {
        _base: base,
        _quote: quote,
      },
    });

    return this.call(callParams);
  }

  tryAggregate(requireSuccess: boolean, calls: CallData[]) {
    const callParams = this.paramsBuilder({
      method: 'tryAggregate',
      params: {
        requireSuccess: IconConverter.toHex(requireSuccess ? 1 : 0),
        calls,
      },
    });

    return this.call(callParams);
  }

  async getAggregateData(requireSuccess: boolean, calls: CallData[]) {
    try {
      const result = await this.tryAggregate(requireSuccess, calls);
      const aggs = result['returnData'];

      const data = aggs.map(agg => {
        if (agg['success'] === '0x0') {
          return null;
        }
        return agg['returnData'];
      });

      return data;
    } catch (err) {
      console.error(err);
      return Array(calls.length).fill(null);
    }
  }
}
