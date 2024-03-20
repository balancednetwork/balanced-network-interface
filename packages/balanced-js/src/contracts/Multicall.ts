import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export interface CallData {
  target: string;
  method: string;
  params: string[];
}

/**
 * Not yet used
 */
export function convertParams(params: any[]): string[] {
  return params.map(param => {
    if (typeof param === 'number') {
      return IconConverter.toHexNumber(param);
    } else if (typeof param === 'boolean') {
      return param ? 'true' : 'false';
    } else {
      return param;
    }
  });
}

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

  async getAggregateData(calls: CallData[]) {
    try {
      const result = await this.tryAggregate(false, calls);
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
