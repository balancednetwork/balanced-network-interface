import React from 'react';

import { useQuery, UseQueryResult } from 'react-query';
import { v4 as uuidv4 } from 'uuid';

import {
  useAddDestinationEvent,
  useFlagRollBackReady,
  useRemoveEvent,
  useRollBackFromOrigin,
  useSetListeningTo,
  useStopListening,
  useXCallDestinationEvents,
  useXCallListeningTo,
  useXCallOriginEvents,
} from 'store/xCall/hooks';

import { ICON_XCALL_NETWORK_ID } from '../_icon/config';
import { CrossChainTxType, XCallEvent, XCallEventType } from '../types';
import { useArchwayContext } from './ArchwayProvider';
import { ARCHWAY_CONTRACTS, ARCHWAY_WEBSOCKET_URL } from './config';
import {
  getCallExecutedEventDataFromArchwayEvent,
  getRollbackEventDataFromArchwayEvent,
  getXCallDestinationEventDataFromArchwayEvent,
} from './utils';

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
  const setListeningTo = useSetListeningTo();
  const iconOriginEvents = useXCallOriginEvents('icon');
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const archwayDestinationEvents = useXCallDestinationEvents('archway');
  const removeEvent = useRemoveEvent();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const flagRollbackReady = useFlagRollBackReady();
  const stopListening = useStopListening();
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
          const queryObject = JSON.parse(JSON.stringify(ARCHWAY_SOCKET_QUERY));
          queryObject.params.query = query;
          websocket.send(JSON.stringify(queryObject));
        };

        websocket.onmessage = event => {
          const eventData = JSON.parse(event.data);
          const events = eventData.result?.events;
          if (events) {
            switch (eventName) {
              case XCallEvent.CallMessage: {
                const destinationEventData = getXCallDestinationEventDataFromArchwayEvent(events);

                if (destinationEventData) {
                  const originEvent = iconOriginEvents.find(e => e.sn === destinationEventData.sn);
                  if (originEvent) {
                    addDestinationEvent('archway', { ...destinationEventData, autoExecute: originEvent.autoExecute });
                    disconnectFromWebsocket();

                    if (originEvent.autoExecute) {
                      setListeningTo('archway', XCallEvent.CallExecuted);
                    }
                  }
                }
                break;
              }
              case XCallEvent.CallExecuted: {
                const callExecutedEventData = getCallExecutedEventDataFromArchwayEvent(events);
                if (callExecutedEventData) {
                  const destinationEvent = archwayDestinationEvents.find(e => e.reqId === callExecutedEventData.reqId);
                  if (destinationEvent) {
                    stopListening();
                    disconnectFromWebsocket();
                    if (callExecutedEventData.success) {
                      removeEvent(destinationEvent.sn, true);
                    } else {
                      rollBackFromOrigin(destinationEvent.origin, destinationEvent.sn);
                      setListeningTo(destinationEvent.origin, XCallEvent.RollbackMessage);
                    }
                  }
                }
                break;
              }
              case XCallEvent.ResponseMessage: {
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
        websocket.onclose = () => {};
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
    setListeningTo,
    archwayDestinationEvents,
    removeEvent,
    rollBackFromOrigin,
    stopListening,
  ]);
};

export function getXcallResult(tx: CrossChainTxType): string | undefined {
  return tx.events.find(e => e.type === 'wasm-CallExecuted')?.attributes.find(a => a.key === 'msg')?.value;
}

export const useArchwayXcallFee = (): UseQueryResult<{ noRollback: string; rollback: string }> => {
  const { client } = useArchwayContext();

  return useQuery(
    [`archway-xcall-fees`, `client-${client ? 'exists' : 'undefined'}`],
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
