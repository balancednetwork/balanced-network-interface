import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class LiquidationDisbursement extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].disbursement;
  }

  getDisbursementDetail(user: string) {
    const callParams = this.paramsBuilder({
      method: 'getDisbursementDetail',
      params: {
        _user: user,
      },
    });

    return this.call(callParams);
  }

  claim() {
    const payload = this.transactionParamsBuilder({
      method: 'claim',
    });

    return this.callICONPlugins(payload);
  }
}
