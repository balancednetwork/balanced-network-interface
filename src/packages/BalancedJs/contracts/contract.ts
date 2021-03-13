import IconService, { IconBuilder, IconConverter, IconAmount } from 'icon-sdk-js';

import { NetworkId } from '../addresses';
import ContractSettings from '../contractSettings';

export class Contract {
  protected provider: IconService;
  protected nid: NetworkId;
  protected address: string = '';

  constructor(contractSettings: ContractSettings) {
    this.provider = contractSettings.provider;
    this.nid = contractSettings.networkId;
  }

  public paramsBuilder({
    account,
    method,
    params,
  }: {
    account: string;
    method: string;
    params?: {
      [key: string]: any;
    };
  }) {
    return new IconBuilder.CallBuilder().from(account).to(this.address).method(method).params(params).build();
  }

  async call(params: any) {
    return new Promise((resolve, reject) => {
      this.provider.call(params).execute().then(resolve).catch(reject);
    });
  }

  /**
   * @returns payload to call Iconex wallet
   */
  public transactionParamsBuilder({
    account,
    method,
    params,
    value,
  }: {
    account: string;
    method: string;
    value: number;
    params?: {
      [key: string]: any;
    };
  }) {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const payload = callTransactionBuilder
      .from(account)
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
