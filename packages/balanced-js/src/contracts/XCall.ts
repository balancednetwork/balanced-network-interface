import addresses from '../addresses';
import { SupportedChainId } from '../chain';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class XCall extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].xCall;
  }

  getNetworkAddress() {
    const callParams = this.paramsBuilder({
      method: 'getNetworkAddress',
    });

    return this.call(callParams);
  }

  getNetworkId() {
    const callParams = this.paramsBuilder({
      method: 'getNetworkId',
    });

    return this.call(callParams);
  }

  verifySuccess(sn: number) {
    const callParams = this.paramsBuilder({
      method: 'verifySuccess',
      params: {
        sn,
      },
    });

    return this.call(callParams);
  }

  getFee(_net: string, _rollback: boolean, sources?: string[]): Promise<string> {
    const callParams = this.paramsBuilder({
      method: 'getFee',
      params: {
        _net,
        _rollback: _rollback ? '0x1' : '0x0',
        _sources: sources,
      },
    });
    return this.call(callParams);
  }

  sendCall(_to: string, _data: string) {
    let payload;
    if (this.nid === SupportedChainId.HAVAH) {
      payload = {
        to: this.address,
        method: 'sendCall',
        params: {
          _to,
          _data,
        },
      };
    } else {
      throw new Error('sendCall not supported on this network');
    }

    return this.callICONPlugins(payload);
  }

  sendCallMessage(_to: string, _data: string, _rollback?: string, sources?: string[], destinations?: string[]) {
    const payload = this.transactionParamsBuilder({
      method: 'sendCallMessage',
      params: {
        _to,
        _data,
        _rollback,
        sources,
        destinations,
      },
    });

    return this.callICONPlugins(payload);
  }

  executeCall(_reqId: string, _data: string) {
    const payload = this.transactionParamsBuilder({
      method: 'executeCall',
      params: {
        _reqId,
        _data,
      },
    });

    return this.callICONPlugins(payload);
  }

  executeRollback(_sn: number) {
    const payload = this.transactionParamsBuilder({
      method: 'executeRollback',
      params: {
        _sn,
      },
    });

    return this.callICONPlugins(payload);
  }
}
