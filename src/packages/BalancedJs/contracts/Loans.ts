import { IconAmount } from 'icon-sdk-js';

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
    //const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    //const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _value: valueHex };
    const payload = this.transactionParamsBuilder({
      method: 'withdrawCollateral',
      value: 0,
      params,
    });
    return this.callIconex(payload);
  }
  /**
   * addCollateral and withdrawCollateral
   * @returns payload to call iconex
   */
  async depositAddCollateral(value: number): Promise<ResponseJsonRPCPayload> {
    //const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    //const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    const params = { _asset: '', _amount: '0x0' };
    const payload = this.transactionParamsBuilder({
      method: 'addCollateral',
      value,
      params,
    });
    return this.callIconex(payload);
  }

  async borrowAdd(value: number): Promise<ResponseJsonRPCPayload> {
    //const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    //const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    /*const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _asset: 'bnUSD', _amount: valueHex };
    const payload = this.transactionParamsBuilder({
      method: 'addCollateral',
      value: 0,
      params,
    });
    console.log(payload);
    return this.callIconex(payload);*/
    const valueHex = '0x' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop().toString(16);
    const params = { _asset: 'bnUSD', _amount: valueHex, _from: this.account };
    const payload = this.transactionParamsBuilder({
      method: 'originateLoan',
      value: 0,
      params,
    });
    console.log(payload);
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
