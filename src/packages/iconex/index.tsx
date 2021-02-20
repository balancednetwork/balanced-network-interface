const ICONEX_RELAY_RESPONSE = 'ICONEX_RELAY_RESPONSE';
const ICONEX_RELAY_REQUEST = 'ICONEX_RELAY_REQUEST';

export type ICONexRequestEventType =
  | 'REQUEST_HAS_ACCOUNT'
  | 'REQUEST_HAS_ADDRESS '
  | 'REQUEST_ADDRESS'
  | 'REQUEST_JSON-RPC'
  | 'REQUEST_SIGNING';

export type ICONexResponseEventType =
  | 'RESPONSE_HAS_ACCOUNT'
  | 'RESPONSE_HAS_ADDRESS'
  | 'RESPONSE_ADDRESS'
  | 'RESPONSE_JSON-RPC'
  | 'RESPONSE_SIGNING';

export type ICONexEventType = ICONexRequestEventType | ICONexResponseEventType;

export interface ICONexRequestEvent {
  type: ICONexRequestEventType;
  payload?: any;
}

export interface ICONexResponseEvent {
  type: ICONexResponseEventType;
  payload?: any;
}

export type ICONexEvent = ICONexRequestEvent | ICONexResponseEvent;

export const request = (event: ICONexRequestEvent): Promise<ICONexResponseEvent> => {
  window.dispatchEvent(
    new CustomEvent(ICONEX_RELAY_REQUEST, {
      detail: event,
    }),
  );

  return new Promise((resolve, reject) => {
    const handler = event => {
      console.log(event.detail);
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
      resolve(event.detail);
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
  });
};
