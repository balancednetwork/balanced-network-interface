import BigNumber from 'bignumber.js';
import IconService, { IconBuilder, IconConverter } from 'icon-sdk-js';
import { isEmpty } from 'lodash';
import { ICONEX_RELAY_RESPONSE } from 'packages/iconex';

import { AccountType, ResponseJsonRPCPayload, SettingInjection } from '..';
import { NetworkId } from '../addresses';
import ContractSettings from '../contractSettings';
import { Ledger } from '../ledger';

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
  public ledger: Ledger;

  constructor(protected contractSettings: ContractSettings) {
    this.provider = contractSettings.provider;
    this.nid = contractSettings.networkId;
    this.ledger = new Ledger(contractSettings);
    this.contractSettings.ledgerSettings.actived = !isEmpty(this.ledger.viewSetting().transport);
  }

  protected get account(): AccountType {
    return this.contractSettings.account;
  }

  public inject({ account, legerSettings }: SettingInjection) {
    this.contractSettings.account = account || this.contractSettings.account;
    this.contractSettings.ledgerSettings.transport =
      legerSettings?.transport || this.contractSettings.ledgerSettings.transport;
    this.contractSettings.ledgerSettings.actived = !isEmpty(this.contractSettings.ledgerSettings.transport);
    this.contractSettings.ledgerSettings.path = legerSettings?.path || this.contractSettings.ledgerSettings.path;
    return this;
  }

  protected cleanParams(params: any) {
    return JSON.parse(
      JSON.stringify(params, (key, value) => {
        return isEmpty(value) && value !== 0 ? undefined : value;
      }),
    );
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
   * @returns Transaction params packaging.
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
  }): TransactionParams {
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();
    const payload = callTransactionBuilder
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
  public transferICXParamsBuilder({ value }: { value: BigNumber }): TransactionParams {
    const payload = new IconBuilder.IcxTransactionBuilder()
      .from(this.account)
      .to(this.address)
      .nid(IconConverter.toBigNumber(this.nid))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(2000000))
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
    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(payload.params);
    }
    return this.callIconex(payload);
  }

  private callIconex(payload: any): Promise<ResponseJsonRPCPayload> {
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

  private async callLedger(payload: any): Promise<any> {
    payload = this.cleanParams(payload);

    if (this.contractSettings.ledgerSettings.actived) {
      const signedTransaction = await this.ledger.signTransaction(payload);
      return {
        result: await this.provider.sendTransaction(signedTransaction).execute(),
      };
    }
  }
}
