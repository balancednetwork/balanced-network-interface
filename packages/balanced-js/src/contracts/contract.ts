import IconService, { Builder as IconBuilder, Converter as IconConverter } from 'icon-sdk-js';
import { ICONEX_RELAY_RESPONSE } from '../iconex';

import { AccountType, ResponseJsonRPCPayload, SettingInjection } from '..';
import { SupportedChainId as NetworkId } from '../chain';
import ContractSettings from '../contractSettings';

export interface TransactionParams {
  jsonrpc: string;
  method: string;
  params: any;
  id: number;
}

export class Contract {
  protected provider: IconService;
  protected nid: NetworkId;
  public address: string = '';

  constructor(
    protected contractSettings: ContractSettings,
    address?: string,
  ) {
    this.provider = contractSettings.provider;
    this.nid = contractSettings.networkId;
    this.address = address || '';
  }

  protected get account(): AccountType {
    return this.contractSettings.account;
  }

  public inject({ account }: SettingInjection) {
    this.contractSettings.account = account || this.contractSettings.account;
    return this;
  }

  public paramsBuilder({
    method,
    blockHeight,
    params,
  }: {
    method: string;
    blockHeight?: number;
    params?: {
      [key: string]: any;
    };
  }) {
    const rawTx = new IconBuilder.CallBuilder().to(this.address).method(method).params(params).build();
    if (blockHeight) rawTx['height'] = IconConverter.toHex(blockHeight);
    return rawTx;
  }

  call(params) {
    return this.provider.call(params).execute();
  }

  /**
   * @returns Transaction params packaging.
   */
  public transactionParamsBuilder({
    method,
    params,
    value = '0',
  }: {
    method: string;
    value?: string;
    params?: {
      [key: string]: any;
    };
  }): TransactionParams {
    const payload = new IconBuilder.CallTransactionBuilder()
      .method(method)
      .params(params)
      .from(this.account!)
      .to(this.address)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(70000000))
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
  public transferICXParamsBuilder({ value }: { value: string }): TransactionParams {
    const payload = new IconBuilder.IcxTransactionBuilder()
      .from(this.account!)
      .to(this.address)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(4000000))
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

  public async callICONPlugins(payload: any): Promise<ResponseJsonRPCPayload> {
    return this.callIconex(payload);
  }

  private callIconex(payload: any): Promise<ResponseJsonRPCPayload> {
    if (this.nid === NetworkId.HAVAH) {
      // @ts-ignore
      return window.havah.sendTransaction(payload);
    } else {
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
  }
}
