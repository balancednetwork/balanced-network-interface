import { isJsonRpcPayloadResponse, isResponseAddressType, isResponseSigningType } from '../index.js';
import type { IconAddress, Result } from '../types.js';

export type IconJsonRpcVersion = '2.0';
export type HanaWalletRequestEvent =
  | 'REQUEST_HAS_ACCOUNT'
  | 'REQUEST_HAS_ADDRESS'
  | 'REQUEST_ADDRESS'
  | 'REQUEST_JSON'
  | 'REQUEST_SIGNING'
  | 'REQUEST_JSON-RPC';
export type HanaWalletResponseEvent =
  | 'RESPONSE_HAS_ACCOUNT'
  | 'RESPONSE_HAS_ADDRESS'
  | 'RESPONSE_ADDRESS'
  | 'RESPONSE_JSON-RPC'
  | 'RESPONSE_SIGNING'
  | 'CANCEL_SIGNING'
  | 'CANCEL_JSON-RPC';

export type ResponseAddressType = {
  type: 'RESPONSE_ADDRESS';
  payload: IconAddress;
};

export type ResponseSigningType = {
  type: 'RESPONSE_SIGNING';
  payload: string;
};

export type RelayRequestDetail = {
  type: HanaWalletRequestEvent;
  payload?: {
    jsonrpc: IconJsonRpcVersion;
    method: string;
    params: unknown;
    id: number | undefined;
  };
};

export type RelayRequestSigning = {
  type: 'REQUEST_SIGNING';
  payload: {
    from: IconAddress;
    hash: string;
  };
};

export type JsonRpcPayloadResponse = {
  id: number;
  result: string; // txHash
};

interface RelayResponseEventDetail {
  type: HanaWalletResponseEvent;
  payload: unknown;
}

export function requestAddress(): Promise<Result<IconAddress>> {
  return new Promise(resolve => {
    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const response = customEvent.detail;
      if (isResponseAddressType(response)) {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        resolve({
          ok: true,
          value: response.payload,
        });
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler, false);
    window.dispatchEvent(
      new CustomEvent<RelayRequestDetail>('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_ADDRESS',
        },
      }),
    );
  });
}

export function requestSigning(from: IconAddress, hash: string): Promise<Result<string>> {
  return new Promise((resolve, reject) => {
    const signRequest = new CustomEvent<RelayRequestSigning>('ICONEX_RELAY_REQUEST', {
      detail: {
        type: 'REQUEST_SIGNING',
        payload: {
          from,
          hash,
        },
      },
    });

    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const response = customEvent.detail;
      if (isResponseSigningType(response)) {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);

        // resolve signature
        resolve({
          ok: true,
          value: response.payload,
        });
      } else if (response.type === 'CANCEL_SIGNING') {
        reject(new Error('CANCEL_SIGNING'));
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.dispatchEvent(signRequest);
  });
}

export function requestJsonRpc<T = unknown>(
  rawTransaction: unknown,
  id = 99999,
): Promise<Result<JsonRpcPayloadResponse>> {
  return new Promise((resolve, reject) => {
    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const { type, payload } = customEvent.detail;
      if (type === 'RESPONSE_JSON-RPC') {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);

        if (isJsonRpcPayloadResponse(payload)) {
          resolve({
            ok: true,
            value: payload,
          });
        } else {
          reject(new Error('Invalid payload response type (expected JsonRpcPayloadResponse)'));
        }
      } else if (type === 'CANCEL_JSON-RPC') {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        reject(new Error('CANCEL_JSON-RPC'));
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.dispatchEvent(
      new CustomEvent<RelayRequestDetail>('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: {
            jsonrpc: '2.0',
            method: 'icx_sendTransaction',
            params: rawTransaction,
            id: id,
          },
        },
      }),
    );
  });
}
