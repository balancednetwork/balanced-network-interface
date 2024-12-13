import * as rlp from 'rlp';

export enum MessageType {
  CallMessage = 0,
  CallMessageWithRollback,
  CallMessagePersisted,
}

export enum CSResponseType {
  CSMessageFailure,
  CSResponseSuccess,
}

export enum CSMessageType {
  CSMessageRequest = 1,
  CSMessageResult,
}

export class CSMessage {
  message_type: CSMessageType;
  payload: Uint8Array;

  constructor(message_type: CSMessageType, payload: Uint8Array) {
    this.message_type = message_type;
    this.payload = payload;
  }

  encode() {
    const rlpInput: rlp.Input = [this.message_type, Buffer.from(this.payload)];
    return rlp.encode(rlpInput);
  }
}
