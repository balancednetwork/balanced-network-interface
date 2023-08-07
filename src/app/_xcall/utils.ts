import { encode } from '@ethersproject/rlp';

export function getRlpEncodedMsg(msg: string | any[]) {
  if (msg instanceof Array)
    return Array.from(
      Buffer.from(encode(msg.map(m => (m instanceof Array ? m.map(x => Buffer.from(x)) : Buffer.from(m))))),
    );
  return Array.from(Buffer.from(encode([Buffer.from(msg)])));
}
