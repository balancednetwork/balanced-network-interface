import { Converter as IconConverter } from 'icon-sdk-js';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class wICX extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].wicx;
  }

  transfer(to: string, value: string, data?: string, shouldConvertDataToHex: boolean = true) {
    const payload = this.transactionParamsBuilder({
      method: 'transfer',
      value: IconConverter.toHexNumber(value),
      params: {
        _to: to,
        _value: IconConverter.toHexNumber(value),
        _data: data && (shouldConvertDataToHex ? IconConverter.toHex(data) : data),
      },
    });
    return this.callICONPlugins(payload);
  }

  deposit(value: string) {
    return this.transfer(addresses[this.nid].dex, value, JSON.stringify({ method: '_deposit' }));
  }

  swapUsingRouteV2(value: string, rlpEncodedData: string) {
    return this.transfer(addresses[this.nid].router, value, rlpEncodedData, false);
  }

  unwrap(amount: string) {
    const payload = this.transactionParamsBuilder({
      method: 'unwrap',
      params: {
        amount: IconConverter.toHexNumber(amount),
      },
    });
    return this.callICONPlugins(payload);
  }
}
