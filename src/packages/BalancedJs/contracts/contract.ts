import BigNumber from 'bignumber.js';
import IconService, { IconBuilder, IconConverter } from 'icon-sdk-js';
import { ICONEX_RELAY_RESPONSE } from 'packages/iconex';

import { AccountType, ResponseJsonRPCPayload, SettingEjection } from '..';
import { NetworkId } from '../addresses';
import ContractSettings from '../contractSettings';

export class Contract {
  protected provider: IconService;
  protected nid: NetworkId;
  public address: string = '';

  constructor(private contractSettings: ContractSettings) {
    this.provider = contractSettings.provider;
    this.nid = contractSettings.networkId;
  }

  protected get account(): AccountType {
    return this.contractSettings.account;
  }

  public eject({ account }: SettingEjection) {
    this.contractSettings.account = account;
    return this;
  }

  public paramsBuilder({
    method,
    params,
  }: {
    method: string;
    params?: {
      [key: string]: any;
    };
  }) {
    return new IconBuilder.CallBuilder().to(this.address).method(method).params(params).build();
  }

  call(params) {
    return this.provider.call(params).execute();
  }

  /**
   * @returns payload to call Iconex wallet
   */
  public transactionParamsBuilder({
    method,
    params,
    value = new BigNumber(0),
  }: {
    method: string;
    value?: BigNumber;
    params?: {
      [key: string]: any;
    };
  }) {
    const payload = new IconBuilder.CallTransactionBuilder()
      .from(this.account)
      .to(this.address)
      .method(method)
      .params(params)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(10000000))
      .value(value)
      .version(IconConverter.toBigNumber(3))
      .build();

    return {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(payload),
      id: Date.now(),
    };
  }

  /**
   * @returns transaction transfer ICX to call ICONex
   */
  public transferICXParamsBuilder({ value }: { value: BigNumber }) {
    const payload = new IconBuilder.IcxTransactionBuilder()
      .from(this.account)
      .to(this.address)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      .value(value)
      .version(IconConverter.toBigNumber(3))
      .build();

    return {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(payload),
      id: Date.now(),
    };
  }

  public async callIconex(payload: any): Promise<ResponseJsonRPCPayload> {
    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload,
        },
      }),
    );
    return new Promise(resolve => {
      const handler = ({ detail: { type, payload } }: any) => {
        if (type === 'RESPONSE_JSON-RPC') {
          window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
          resolve(payload);
        }
      };

      window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    });
  }

  public async getICXBalance(): Promise<BigNumber> {
    const balance = await this.provider.getBalance(this.account).execute();
    return balance;
  }
}
