import { Event } from '@cosmjs/cosmwasm-stargate';

import { OriginCallData } from 'app/_xcall/types';

import { ARCHWAY_EVENT_XCALL_MSG_SENT } from '../types';

export function getXCallOriginEventDataFromArchway(events: readonly Event[]): OriginCallData | undefined {
  const xCallSentEvent = events.find(e => e.type === ARCHWAY_EVENT_XCALL_MSG_SENT);
  const xCallDataEvent = events.find(e => e.type === 'wasm-send_packet');
  const data = xCallDataEvent && xCallDataEvent.attributes.find(a => a.key === 'packet_data_hex')?.value;
  const sn = xCallSentEvent && xCallSentEvent.attributes.find(a => a.key === 'sn')?.value;

  if (sn && data) {
    return {
      sn: parseInt(sn),
      data,
    };
  }
}
