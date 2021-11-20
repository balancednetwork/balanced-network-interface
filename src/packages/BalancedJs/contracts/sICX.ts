import BigNumber from 'bignumber.js';
import { IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class sICX extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].sicx;
  }

  depositAndBorrow(value: BigNumber) {
    const data = { _asset: '', _amount: 0 };
    return this.transfer(addresses[this.nid].loans, value, JSON.stringify(data));
  }

  swapToICX(value: BigNumber) {
    const data = { method: '_swap_icx' };

    return this.transfer(addresses[this.nid].dex, value, JSON.stringify(data));
  }

  unstake(value: BigNumber) {
    return this.transfer(
      addresses[this.nid].staking,
      IconConverter.toHex(value),
      JSON.stringify({ method: 'unstake' }),
    );
  }
}
