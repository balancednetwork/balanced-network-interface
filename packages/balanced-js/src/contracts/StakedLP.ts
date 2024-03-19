import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class StakedLP extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].stakedLp;
  }

  balanceOf(owner: string, poolId: number, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      blockHeight: blockHeight,
      params: {
        _id: IconConverter.toHex(poolId),
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  totalSupply(poolId: number) {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
      params: {
        _id: IconConverter.toHex(poolId),
      },
    });

    return this.call(callParams);
  }

  unstake(poolId: number, value: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'unstake',
      params: {
        id: IconConverter.toHex(poolId),
        value: IconConverter.toHexNumber(value),
      },
    });

    return this.callICONPlugins(callParams);
  }

  getDataSources() {
    const payload = this.paramsBuilder({
      method: 'getDataSources',
    });

    return this.call(payload);
  }

  getSourceName(sourceID: number) {
    const payload = this.paramsBuilder({
      method: 'getSourceName',
      params: {
        id: IconConverter.toHexNumber(sourceID)
      }
    });

    return this.call(payload);
  }

  getSourceId(source: string) {
    const payload = this.paramsBuilder({
      method: 'getSourceId',
      params: {
        name: source
      }
    });

    return this.call(payload);
  }

  getAllowedPoolIds() {
    const payload = this.paramsBuilder({
      method: 'getAllowedPoolIds',
    });

    return this.call(payload);
  }

  totalStaked(id: number) {
    const payload = this.paramsBuilder({
      method: 'totalStaked',
      params: {
        _id: IconConverter.toHex(id),
      }
    });

    return this.call(payload);
  }
}
