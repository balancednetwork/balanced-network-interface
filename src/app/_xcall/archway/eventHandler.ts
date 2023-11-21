import React from 'react';

import { useQuery, UseQueryResult } from 'react-query';
import { v4 as uuidv4 } from 'uuid';

import {
  useAddDestinationEvent,
  useFlagRollBackReady,
  useXCallListeningTo,
  useXCallOriginEvents,
} from 'store/xCall/hooks';

import { ICON_XCALL_NETWORK_ID } from '../_icon/config';
import { CrossChainTxType, XCallEvent, XCallEventType } from '../types';
import { useArchwayContext } from './ArchwayProvider';
import { ARCHWAY_CONTRACTS, ARCHWAY_WEBSOCKET_URL } from './config';
import { getRollbackEventDataFromArchwayEvent, getXCallDestinationEventDataFromArchwayEvent } from './utils';

const ARCHWAY_SOCKET_QUERY = {
  jsonrpc: '2.0',
  method: 'subscribe',
  id: uuidv4().toString(),
  params: {
    query: ``,
  },
};

export const useArchwayEventListener = () => {
  const listeningTo = useXCallListeningTo();
  const eventName: XCallEventType | null = listeningTo?.chain === 'archway' ? listeningTo.event : null;
  const [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);
  const addDestinationEvent = useAddDestinationEvent();
  const iconOriginEvents = useXCallOriginEvents('icon');
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const flagRollbackReady = useFlagRollBackReady();
  const query = `wasm-${eventName} EXISTS`;

  const disconnectFromWebsocket = React.useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ ...ARCHWAY_SOCKET_QUERY, method: 'unsubscribe' }));
    socket.close();
    setSocket(undefined);
  }, [socket]);

  React.useEffect(() => {
    if (eventName) {
      if (!socket) {
        const websocket = new WebSocket(ARCHWAY_WEBSOCKET_URL);

        websocket.onopen = () => {
          console.log('xCall debug - archway ws opened');
          const queryObject = JSON.parse(JSON.stringify(ARCHWAY_SOCKET_QUERY));
          queryObject.params.query = query;
          websocket.send(JSON.stringify(queryObject));
        };

        websocket.onmessage = event => {
          const eventData = JSON.parse(event.data);
          const events = eventData.result?.events;
          console.log('xCall debug - Arch tx info: ', eventData.result);
          if (events) {
            console.log('xCall debug - Matching transaction found: ', events);
            switch (eventName) {
              case XCallEvent.CallMessage: {
                const destinationEventData = getXCallDestinationEventDataFromArchwayEvent(events);

                if (destinationEventData) {
                  if (iconOriginEvents.some(e => e.sn === destinationEventData.sn)) {
                    addDestinationEvent('archway', destinationEventData);
                    disconnectFromWebsocket();
                  }
                }
                break;
              }
              case XCallEvent.ResponseMessage: {
                //TODO: handle response message
                console.log('TODO: logged event from ResponseMessage: ', events);
                break;
              }
              case XCallEvent.RollbackMessage: {
                const rollbackEventData = getRollbackEventDataFromArchwayEvent(events);

                if (rollbackEventData) {
                  if (archwayOriginEvents.some(e => e.sn === parseInt(rollbackEventData.sn))) {
                    flagRollbackReady('archway', parseInt(rollbackEventData.sn));
                    disconnectFromWebsocket();
                  }
                }
                break;
              }
            }
          }
        };

        websocket.onerror = error => {
          console.error(error);
          disconnectFromWebsocket();
        };
        websocket.onclose = () => {
          console.log('xCall debug - archway ws closed');
        };
        setSocket(websocket);
      }
    } else {
      disconnectFromWebsocket();
    }
  }, [
    socket,
    disconnectFromWebsocket,
    eventName,
    query,
    addDestinationEvent,
    iconOriginEvents,
    archwayOriginEvents,
    flagRollbackReady,
  ]);
};

export function getXcallResult(tx: CrossChainTxType): string | undefined {
  return tx.events.find(e => e.type === 'wasm-CallExecuted')?.attributes.find(a => a.key === 'msg')?.value;
}

export const useArchwayXcallFee = (): UseQueryResult<{ noRollback: string; rollback: string }> => {
  const { client } = useArchwayContext();

  return useQuery(
    [`archway-xcall-fees`, client],
    async () => {
      if (client) {
        const feeWithRollback = await client.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
          get_fee: { nid: ICON_XCALL_NETWORK_ID, rollback: true },
        });
        const feeNoRollback = await client.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
          get_fee: { nid: ICON_XCALL_NETWORK_ID, rollback: false },
        });

        return {
          noRollback: feeNoRollback,
          rollback: feeWithRollback,
        };
      }
    },
    { enabled: !!client, keepPreviousData: true },
  );
};
