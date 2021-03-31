import BigNumber from 'bignumber.js';
import { IconAmount } from 'icon-sdk-js';

import { ResponseJsonRPCPayload } from '..';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Baln extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].baln;
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

  getLiquidityBALNSupply() {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: this.account,
        _id: this.address,
      },
    });

    return this.call(callParams);
  }

  async swapToBnUSD(value: BigNumber, slippage: string): Promise<ResponseJsonRPCPayload> {
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

  async stake(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _value: valueHex };
    const payload = this.transactionParamsBuilder({
      method: 'stake',
      params,
    });

    return this.callIconex(payload);
  }
}
