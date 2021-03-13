import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class sICX extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].sicx;
  }

  balanceOf({ account }: { account: string }) {
    const callParams = this.paramsBuilder({
      account,
      method: 'balanceOf',
      params: {
        _owner: account,
      },
    });

    return this.call(callParams);
  }
}
