import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class StabilityFund extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].stabilityfund;
  }

  //return list of whitelisted token addresses
  getAcceptedTokens() {
    const payload = this.paramsBuilder({
      method: 'getAcceptedTokens',
    });

    return this.call(payload);
  }

  //getFeeIn is used to calculate amount received when sending whitelisted token into contract
  getFeeIn() {
    const payload = this.paramsBuilder({
      method: 'getFeeIn',
    });

    return this.call(payload);
  }

  //getFeeOut is used to calculate amount received when sending bnUSD into contract
  getFeeOut() {
    const payload = this.paramsBuilder({
      method: 'getFeeOut',
    });

    return this.call(payload);
  }

  //returns balance limit of the token in stability fund
  getLimit(address: string) {
    const payload = this.paramsBuilder({
      method: 'getLimit',
      params: {
        _address: address,
      },
    });

    return this.call(payload);
  }
}
