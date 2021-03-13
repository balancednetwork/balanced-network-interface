import IconService, { IconBuilder, IconConverter, IconAmount } from 'icon-sdk-js';

import { AccountType } from '.';
import { NetworkId } from '../../constants/addresses';
import { iconService } from '../icon-react/index';

export class IconWrapper {
  protected caller: IconService = iconService;
  protected address: string = '';
  protected account: AccountType = '';

  constructor(protected nid: NetworkId) {}

  public paramsBuilder({
    method,
    params,
  }: {
    method: string;
    params?: {
      [key: string]: any;
    };
  }) {
    return new IconBuilder.CallBuilder().from(this.account).to(this.address).method(method).params(params).build();
  }

  async call(params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.caller.call(params).execute().then(resolve).catch(reject);
    });
  }

  /**
   * @returns payload to call Iconex wallet
   */
  public transactionParamsBuilder({
    method,
    params,
    value,
  }: {
    method: string;
    value?: number;
    params?: {
      [key: string]: any;
    };
  }) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const payload = callTransactionBuilder
      .from(this.account)
      .to(this.address)
      .method(method)
      .params(params)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(IconAmount.of(value, IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber(3))
      .build();

    return {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(payload),
      id: Date.now(),
    };
  }
}
