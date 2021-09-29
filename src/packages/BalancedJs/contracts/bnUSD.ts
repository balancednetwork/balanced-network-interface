import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class bnUSD extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bnusd;
  }

  transfer(to: string, value: BigNumber, data?: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHex(value),
        _data: data && IconConverter.toHex(data),
      },
    });

    return this.callICONPlugins(callParams);
  }

  swap(value: BigNumber, outputSymbol: string, minimumReceive: BigNumber) {
    const data = {
      method: '_swap',
      params: {
        toToken: addresses[this.nid][outputSymbol.toLowerCase()],
        minimumReceive: minimumReceive.toFixed(),
      },
    };

    return this.transfer(addresses[this.nid].dex, value, JSON.stringify(data));
  }
}
