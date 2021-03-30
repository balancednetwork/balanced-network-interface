import { IconAmount } from 'icon-sdk-js';

import { ResponseJsonRPCPayload } from '..';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dex extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dex;
  }

  getPrice(pid: string) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: {
        _pid: pid,
      },
    });

    return this.call(callParams);
  }

  async dexSupplysICXbnUSD(baseValue: number, quoteValue: number): Promise<ResponseJsonRPCPayload> {
    const hexBasePrice = '0x' + IconAmount.of(baseValue, IconAmount.Unit.ICX).toLoop().toString(16);
    const hexQuotePrice = '0x' + IconAmount.of(quoteValue, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = {
      _baseToken: addresses[this.nid].sicx,
      _quoteToken: addresses[this.nid].bnUSD,
      _maxBaseValue: hexBasePrice,
      _quoteValue: hexQuotePrice,
    };
    const payload = this.transactionParamsBuilder({
      method: 'add',
      value: 0,
      params,
    });
    console.log(payload);
    return this.callIconex(payload);
  }

  async supplyBALNbnUSD(baseValue: number, quoteValue: number): Promise<ResponseJsonRPCPayload> {
    const hexBasePrice = '0x' + IconAmount.of(baseValue, IconAmount.Unit.ICX).toLoop().toString(16);
    const hexQuotePrice = '0x' + IconAmount.of(quoteValue, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = {
      _baseToken: addresses[this.nid].baln,
      _quoteToken: addresses[this.nid].bnUSD,
      _maxBaseValue: hexBasePrice,
      _quoteValue: hexQuotePrice,
    };
    const payload = this.transactionParamsBuilder({
      method: 'add',
      value: 0,
      params,
    });
    console.log(payload);
    return this.callIconex(payload);
  }

  getDeposit(tokenAddress: string) {
    const callParams = this.paramsBuilder({
      method: 'getDeposit',
      params: {
        _tokenAddress: tokenAddress,
        _user: this.account,
      },
    });

    return this.call(callParams);
  }

  balanceOf(pid: string) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: this.account,
        _id: pid,
      },
    });
    return this.call(callParams);
  }

  getTotalSupply(pid: string) {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
      params: {
        _pid: pid,
      },
    });

    return this.call(callParams);
  }

  getPoolTotal(pid: string, tokenAddress: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolTotal',
      params: {
        _pid: pid,
        _token: tokenAddress,
      },
    });

    return this.call(callParams);
  }

  transferICX(value: number) {
    const payload = this.transferICXParamsBuilder({
      value: value,
    });

    return this.callIconex(payload);
  }

  getICXBalance() {
    const callParams = this.paramsBuilder({
      method: 'getICXBalance',
      params: {
        _address: this.account,
      },
    });

    return this.call(callParams);
  }

  getICXWithdrawLock() {
    const callParams = this.paramsBuilder({
      method: 'getICXWithdrawLock',
    });

    return this.call(callParams);
  }

  cancelSicxIcxOrder() {
    const payload = this.transactionParamsBuilder({
      method: 'cancelSicxicxOrder',
      value: 0,
    });

    return this.callIconex(payload);
  }

  // This method can withdraw up to a user's holdings in a pool, but it cannot
  // be called if the user has not passed their withdrawal lock time period.
  withdrawalTokens(pid: number, value: number) {
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const payload = this.transactionParamsBuilder({
      method: 'remove',
      value: 0,
      params: {
        _pid: pid.toString(16),
        _value: valueHex,
        _withdraw: '0x1',
      },
    });
    console.log(payload);
    return this.callIconex(payload);
  }
}
