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

  getSupply(pid: string) {
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

  getICXBalance() {
    const callParams = this.paramsBuilder({
      method: 'getICXBalance',
      params: {
        _address: this.account,
      },
    });

    return this.call(callParams);
  }
}
