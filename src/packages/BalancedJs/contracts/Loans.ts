import { ResponseJsonRPCPayload } from '..';
import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }
  /**
   * addCollateral and withdrawCollateral
   * @returns payload to call iconex
   */
  async depositWithdrawCollateral(value: number): Promise<ResponseJsonRPCPayload> {
    const params = { _amount: '0x1' };
    const payload = this.transactionParamsBuilder({
      method: 'withdrawCollateral',
      value,
      params,
    });
    return this.callIconex(payload);
  }
  /**
   * addCollateral and withdrawCollateral
   * @returns payload to call iconex
   */
  async depositAddCollateral(value: number): Promise<ResponseJsonRPCPayload> {
    const params = { _amount: '0x1' };
    const payload = this.transactionParamsBuilder({
      method: 'addCollateral',
      value,
      params,
    });
    return this.callIconex(payload);
  }
  getAvailableAssets() {
    const callParams = this.paramsBuilder({
      method: 'getAvailableAssets',
    });
    return this.call(callParams);
  }
  getAccountPositions() {
    const callParams = this.paramsBuilder({
      method: 'getAccountPositions',
      params: {
        _owner: this.account,
      },
    });
    return this.call(callParams);
  }
}
