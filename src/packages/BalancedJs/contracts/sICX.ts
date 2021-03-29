import { IconAmount } from 'icon-sdk-js';

import { ResponseJsonRPCPayload } from '..';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class sICX extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].sicx;
  }

  async borrowAdd(value: number): Promise<ResponseJsonRPCPayload> {
    const data = Buffer.from(
      '{"method": "_deposit_and_borrow", "params": {"_sender": "' +
        this.account +
        '", "_asset": "", "_amount": "0x0"}}',
      'utf8',
    ).toString('hex');
    const params = {
      _to: addresses[this.nid].loans,
      _value: '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16),
      _data: data,
    };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      value,
      params,
    });

    return this.callIconex(payload);
  }

  async dexDeposit(value: number): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_deposit"}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      value: 0,
      params,
    });

    return this.callIconex(payload);
  }

  async swapBybnUSD(value: number, slippage: string): Promise<ResponseJsonRPCPayload> {
    const data =
      '0x' +
      Buffer.from(
        '{"method": "_swap", "params": {"toToken":"' +
          addresses[this.nid].bnUSD +
          '", "maxSlippage":' +
          slippage +
          '}}',
        'utf8',
      ).toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      value: 0,
      params,
    });

    return this.callIconex(payload);
  }

  async swapToICX(value: number): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_swap_icx"}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      value: 0,
      params,
    });

    return this.callIconex(payload);
  }

  balanceOf() {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: this.account,
      },
    });

    return this.call(callParams);
  }

  getUnstakingAmount() {
    const callParams = this.paramsBuilder({
      method: 'getUserUnstakeInfo',
      params: {
        _owner: this.account,
      },
    });

    return this.call(callParams);
  }
}
