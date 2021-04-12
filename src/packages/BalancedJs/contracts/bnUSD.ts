import BigNumber from 'bignumber.js';
import { IconAmount, IconConverter } from 'icon-sdk-js';

import { ResponseJsonRPCPayload } from '..';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class bnUSD extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bnusd;
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

  async dexDeposit(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_deposit"}', 'utf8').toString('hex');
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });
    return this.callIconex(payload);
  }

  async swapBysICX(value: BigNumber, slippage: string): Promise<ResponseJsonRPCPayload> {
    const data =
      '0x' +
      Buffer.from(
        '{"method": "_swap", "params": {"toToken":"' + addresses[this.nid].sicx + '", "maxSlippage":' + slippage + '}}',
        'utf8',
      ).toString('hex');
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });
    return this.callIconex(payload);
  }

  totalSupply() {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
    });

    return this.call(callParams);
  }

  async repayLoan(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = { method: '_repay_loan', params: {} };
    const dataHex = '0x' + Buffer.from(JSON.stringify(data), 'utf8').toString('hex');
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _to: addresses[this.nid].loans, _value: valueHex, _data: dataHex };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });
    return this.callIconex(payload);
  }

  public async transfer(to: string, value: BigNumber): Promise<any> {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop()),
      },
    });

    return this.callIconex(callParams);
  }

  async retireBnUSD(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const data = '0x' + Buffer.from('{"method": "_retire_asset", "params": {}}', 'utf8').toString('hex');
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _to: addresses[this.nid].loans, _value: valueHex, _data: data };

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });

    return this.callIconex(payload);
  }

  async swapToOutputCurrency(
    value: BigNumber,
    outputSymbol: string,
    slippage: string,
  ): Promise<ResponseJsonRPCPayload> {
    const data =
      '0x' +
      Buffer.from(
        '{"method": "_swap", "params": {"toToken":"' +
          addresses[this.nid][outputSymbol.toLowerCase()] +
          '", "maxSlippage":' +
          slippage +
          '}}',
        'utf8',
      ).toString('hex');
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _to: addresses[this.nid].dex, _value: valueHex, _data: data };
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params,
    });

    return this.callIconex(payload);
  }
}
