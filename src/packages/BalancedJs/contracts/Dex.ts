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

  getPrice(params: { _pid: string }) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params,
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
}
