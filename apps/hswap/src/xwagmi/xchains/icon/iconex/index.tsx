export const ICONEX_RELAY_RESPONSE = 'ICONEX_RELAY_RESPONSE';
export const ICONEX_RELAY_REQUEST = 'ICONEX_RELAY_REQUEST';

export enum ICONexRequestEventType {
  REQUEST_HAS_ACCOUNT = 'REQUEST_HAS_ACCOUNT',
  REQUEST_HAS_ADDRESS = 'REQUEST_HAS_ADDRESS',
  REQUEST_ADDRESS = 'REQUEST_ADDRESS',
  REQUEST_JSON = 'REQUEST_JSON',
  REQUEST_SIGNING = 'REQUEST_SIGNING',
}

export enum ICONexResponseEventType {
  RESPONSE_HAS_ACCOUNT = 'RESPONSE_HAS_ACCOUNT',
  RESPONSE_HAS_ADDRESS = 'RESPONSE_HAS_ADDRESS',
  RESPONSE_ADDRESS = 'RESPONSE_ADDRESS',
  RESPONSE_JSON = 'RESPONSE_JSON',
  RESPONSE_SIGNING = 'RESPONSE_SIGNING',
}

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
  return new Promise((resolve, reject) => {
    const handler = evt => {
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
      resolve(evt.detail);
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    window.dispatchEvent(
      new CustomEvent(ICONEX_RELAY_REQUEST, {
        detail: event,
      }),
    );
  });
};
