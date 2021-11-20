import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class ICX extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = 'cx0000000000000000000000000000000000000000';
  }

  balanceOf(account: string) {
    return this.provider.getBalance(account).execute();
  }
}
