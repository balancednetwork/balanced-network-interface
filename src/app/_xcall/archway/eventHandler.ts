import React from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useAddDestinationEvent, useXCallOriginEvents } from 'store/xCall/hooks';

import { XCallEvent, XCallEventType } from '../types';
import { getXCallDestinationEventDataFromArchwayEvent } from './ArchwayTest/helpers';
import { ARCHWAY_WEBSOCKET_URL } from './config';

const ARCHWAY_SOCKET_QUERY = {
  jsonrpc: '2.0',
  method: 'subscribe',
  id: uuidv4().toString(),
  params: {
    query: ``,
  },
};

export const useArchwayEventListener = (eventName: XCallEventType | null) => {
  const [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);
  const addDestinationEvent = useAddDestinationEvent();
  const iconOriginEvents = useXCallOriginEvents('icon');
  // const query = `tm.event = 'Tx' AND wasm-${eventName} EXISTS`;
  const query = `wasm-${eventName} EXISTS`;

  const disconnectFromWebsocket = React.useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    console.log('disconnecting from archway ws');
    socket.send(JSON.stringify({ ...ARCHWAY_SOCKET_QUERY, method: 'unsubscribe' }));
    socket.close();
    setSocket(undefined);
  }, [socket]);

  React.useEffect(() => {
    if (eventName && !socket) {
      const websocket = new WebSocket(ARCHWAY_WEBSOCKET_URL);

      websocket.onopen = () => {
        console.log('archway ws opened');
        const queryObject = JSON.parse(JSON.stringify(ARCHWAY_SOCKET_QUERY));
        queryObject.params.query = query;
        websocket.send(JSON.stringify(queryObject));
      };

      websocket.onmessage = event => {
        const eventData = JSON.parse(event.data);
        const events = eventData.result?.events;
        console.log('Arch tx info: ', eventData.result);
        if (events) {
          console.log('Matching transaction found: ', events);
          switch (eventName) {
            case XCallEvent.CallMessage: {
              const destinationEventData = getXCallDestinationEventDataFromArchwayEvent(events);

              if (destinationEventData) {
                if (iconOriginEvents.find(e => e.sn === destinationEventData.sn)) {
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
              //TODO: handle rollback message
              console.log('TODO: logged event from RollbackMessage: ', events);
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
        console.log('archway ws closed');
      };
      setSocket(websocket);
    }
    if (!eventName) {
      disconnectFromWebsocket();
    }
  }, [socket, disconnectFromWebsocket, eventName, query, addDestinationEvent, iconOriginEvents]);
};
