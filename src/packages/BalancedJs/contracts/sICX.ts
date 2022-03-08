import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class sICX extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].sicx;
  }

  depositAndBorrow(value: string) {
    const data = { _asset: '', _amount: 0 };
    return this.transfer(addresses[this.nid].loans, value, JSON.stringify(data));
  }

  /**
   * not used
   * @param value
   * @returns {Promise<void>}
   */
  swapToICX(value: string) {
    const data = { method: '_swap_icx' };

    return this.transfer(addresses[this.nid].dex, value, JSON.stringify(data));
  }

  unstake(value: string) {
    return this.transfer(addresses[this.nid].staking, value, JSON.stringify({ method: 'unstake' }));
  }
}
