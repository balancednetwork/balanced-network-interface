import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import { Contract } from './contract';

export default class TokenContract extends Contract {
  swapUsingRoute(value: BigNumber, outputSymbol: string, minimumReceive: BigNumber, path: (string | null)[]) {
    const data = {
      method: '_swap',
      params: {
        toToken: addresses[this.nid][outputSymbol.toLowerCase()],
        minimumReceive: minimumReceive.toFixed(),
        path: JSON.stringify(path),
      },
    };

    return this.transfer(addresses[this.nid].router, value, JSON.stringify(data));
  }

  swap(value: BigNumber, outputSymbol: string, minimumReceive: BigNumber) {
    const data = {
      method: '_swap',
      params: { toToken: addresses[this.nid][outputSymbol.toLowerCase()], minimumReceive: minimumReceive.toFixed() },
    };

    return this.transfer(addresses[this.nid].dex, value, JSON.stringify(data));
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
}
