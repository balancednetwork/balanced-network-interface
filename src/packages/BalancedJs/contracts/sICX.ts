import BigNumber from 'bignumber.js';
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

  async borrowAdd(value: BigNumber): Promise<ResponseJsonRPCPayload> {
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
      value: value,
      params,
    });

    return this.callIconex(payload);
  }

  async collateralDeposit(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = { method: '_deposit_and_borrow', params: { _sender: this.account, _asset: '', _amount: 0 } };
    const dataHex = '0x' + Buffer.from(JSON.stringify(data), 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].loans, _value: valueHex, _data: dataHex };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });
    console.log(payload);
    return this.callIconex(payload);
  }

  async dexDeposit(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_deposit"}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });

    return this.callIconex(payload);
  }

  async swapBybnUSD(value: BigNumber, slippage: string): Promise<ResponseJsonRPCPayload> {
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
      params,
    });

    return this.callIconex(payload);
  }

  async swapToICX(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_swap_icx"}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
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

  public async transfer(to: string, value: BigNumber): Promise<any> {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16),
      },
    });

    return this.callIconex(callParams);
  }

  async unstake(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_unstake"}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _to: addresses[this.nid].staking, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });

    return this.callIconex(payload);
  }
}
