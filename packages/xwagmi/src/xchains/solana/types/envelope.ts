import * as rlp from 'rlp';

export class CallMessage {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  encode() {
    const rlpInput: rlp.Input = [Buffer.from(this.data)];

    return rlp.encode(rlpInput);
  }
}

export class CallMessageWithRollback {
  data: Uint8Array;
  rollback: Uint8Array;

  constructor(data: Uint8Array, rollback: Uint8Array) {
    this.data = data;
    this.rollback = rollback;
  }

  encode() {
    const rlpInput: rlp.Input = [Buffer.from(this.data), Buffer.from(this.rollback)];

    return rlp.encode(rlpInput);
  }
}

export class CallMessagePersisted {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  encode() {
    const rlpInput: rlp.Input = [Buffer.from(this.data)];
    return rlp.encode(rlpInput);
  }
}

export class Envelope {
  msg_type: number;
  message: Uint8Array;
  sources: string[];
  destinations: string[];

  constructor(msg_type: number, message: Uint8Array, sources: string[], destinations: string[]) {
    this.msg_type = msg_type;
    this.message = message;
    this.sources = sources;
    this.destinations = destinations;
  }

  encode() {
    const rlpInput: rlp.Input = [this.msg_type, Buffer.from(this.message), this.sources, this.destinations];

    return rlp.encode(rlpInput);
  }
}
