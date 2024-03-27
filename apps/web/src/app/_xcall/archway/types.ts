export const ARCHWAY_EVENT_XCALL_MSG_SENT = 'wasm-CallMessageSent';

export type ArchwayTxResponseType = { [key in string]: any } & {
  events: { type: string; attributes: { key: string; value: string }[] }[];
};
