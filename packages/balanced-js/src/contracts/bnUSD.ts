import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class bnUSD extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].bnusd;
  }

  stake(value: string) {
    const transferData = JSON.stringify({
      method: "_lock"
    })

    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: addresses[this.nid].savings,
        _value: IconConverter.toHexNumber(value),
        _data: transferData && IconConverter.toHex(transferData),
      },
    });

    return this.callICONPlugins(payload);
  }
}
