import React from 'react';

import bnJs from 'bnJs';
import { useBlockNumber } from 'store/application/hooks';
import { useAddDestinationEvent, useXCallOriginEvents } from 'store/xCall/hooks';

import { XCallEvent, XCallEventType } from '../types';
import { ICON_WEBSOCKET_URL } from './config';
import { getICONEventSignature } from './utils';

const QUERY_PARAMS = {
  height: '',
  eventFilters: [
    {
      event: '',
      addr: bnJs.XCall.address,
    },
  ],
  logs: '0x1',
};

export const useICONEventListener = (eventName: XCallEventType | null) => {
  const [socket, setSocket] = React.useState<WebSocket | undefined>(undefined);
  const event = eventName && `${getICONEventSignature(eventName)}`;
  const iconBlockHeight = useBlockNumber();
  const blockHeightRef = React.useRef<string | null>(null);
  const addDestinationEvent = useAddDestinationEvent();
  const archwayOriginEvents = useXCallOriginEvents('archway');

  React.useEffect(() => {
    if (event && iconBlockHeight) {
      if (!blockHeightRef.current) {
        blockHeightRef.current = `0x${iconBlockHeight.toString(16)}`;
      }
    } else {
      blockHeightRef.current = null;
    }
  }, [iconBlockHeight, event]);

  const query = React.useRef({ ...QUERY_PARAMS });
  if (event && blockHeightRef.current) {
    query.current.eventFilters[0].event = event;
    query.current.height = blockHeightRef.current;
  }

  const disconnectFromWebsocket = React.useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.close();
    setSocket(undefined);
  }, [socket]);

  React.useEffect(() => {
    if (eventName && !socket) {
      const websocket = new WebSocket(ICON_WEBSOCKET_URL);

      websocket.onopen = () => {
        console.log('xCall debug - ICON websocket opened');
        websocket.send(JSON.stringify(query.current));
      };

      websocket.onmessage = event => {
        const eventData = JSON.parse(event.data);
        console.log('xCall debug - ICON block: ', eventData);
        if (eventData) {
          switch (eventName) {
            case XCallEvent.CallMessage: {
              if (eventData.logs) {
                console.log('xCall debug - Matching event found: ' + eventData);
                const callMessageLog =
                  eventData.logs &&
                  eventData.logs[0][0].find(log => log.indexed[0] === getICONEventSignature(XCallEvent.CallMessage));
                if (callMessageLog) {
                  const snRaw = callMessageLog.indexed[3];
                  const sn = snRaw && parseInt(snRaw, 16);
                  const reqId = parseInt(callMessageLog.data[0], 16);
                  const data = callMessageLog.data[1];
                  //todo: handle parsing from above like the line below
                  // const destinationEventData = getDestinationEventDataFromICONEvent(callMessageLog);
                  if (sn && reqId) {
                    if (archwayOriginEvents.some(e => e.sn === sn)) {
                      addDestinationEvent('icon', { sn, reqId, data, eventName: XCallEvent.CallMessage });
                      disconnectFromWebsocket();
                    }
                  }
                }
              }
              break;
            }
            case XCallEvent.ResponseMessage: {
              break;
            }
            case XCallEvent.RollbackMessage: {
              break;
            }
          }
          disconnectFromWebsocket();
        }
      };

      websocket.onerror = error => {
        console.error(error);
        disconnectFromWebsocket();
      };
      websocket.onclose = () => {
        console.log('xCall debug - ICON ws closed');
      };
      setSocket(websocket);
    } else {
      if (socket) {
        disconnectFromWebsocket();
      }
    }
  }, [socket, disconnectFromWebsocket, eventName, query, addDestinationEvent, archwayOriginEvents]);
};
