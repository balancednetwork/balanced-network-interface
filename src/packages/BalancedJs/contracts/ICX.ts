import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class ICX extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].baln;
  }

  balanceOf(account: string) {
    return this.provider.getBalance(account).execute();
  }

  transfer(to: string, value: BigNumber, data: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHex(value),
        _data: IconConverter.toHex(data),
      },
    });

    return this.callICONPlugins(callParams);
  }

  claim(to: string) {
    // const callParams = this.transactionParamsBuilder({
    //   method: 'claimUnstakedICX',
    //   params: {
    //     _to: to,
    //   },
    // });
    // return this.callICONPlugins(callParams);
  }
}
