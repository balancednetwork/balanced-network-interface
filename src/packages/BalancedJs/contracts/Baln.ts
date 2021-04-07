import BigNumber from 'bignumber.js';
import { IconAmount, IconConverter } from 'icon-sdk-js';

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
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
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
        _value: IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop()),
      },
    });

    return this.callIconex(callParams);
  }

  async stake(value: BigNumber): Promise<ResponseJsonRPCPayload> {
    const valueHex = IconConverter.toHex(IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop());
    const params = { _value: valueHex };
    const payload = this.transactionParamsBuilder({
      method: 'stake',
      params,
    });

    return this.callIconex(payload);
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

  public detailsBalanceOf(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'detailsBalanceOf',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }
}
