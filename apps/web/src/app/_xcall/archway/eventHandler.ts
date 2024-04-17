import React, { useState, useEffect, useRef } from 'react';

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
import { CrossChainTxType, IXCallFee, XCallEventType } from '../types';
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
  const addDestinationEvent = useAddDestinationEvent();
  const setListeningTo = useSetListeningTo();
  const iconOriginEvents = useXCallOriginEvents('icon');
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const archwayDestinationEvents = useXCallDestinationEvents('archway');
  const removeEvent = useRemoveEvent();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const flagRollbackReady = useFlagRollBackReady();
  const stopListening = useStopListening();
  const query = eventName ? `wasm-${eventName} EXISTS` : null;

  const socketRef = useRef<WebSocket | undefined>(undefined);

  const [isReady, setIsReady] = useState(false);

  // initialize the websocket connection
  useEffect(() => {
    // create a new websocket
    socketRef.current = new WebSocket(ARCHWAY_WEBSOCKET_URL);

    // set the ready state
    socketRef.current.onopen = () => {
      setIsReady(true);
    };

    return () => {
      // close the websocket connection
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && isReady) {
      const websocket = socketRef.current;
      // subscribe to the event
      websocket.send(JSON.stringify({ ...ARCHWAY_SOCKET_QUERY, params: { query: query } }));

      return () => {
        // unsubscribe from the event
        websocket.send(JSON.stringify({ ...ARCHWAY_SOCKET_QUERY, method: 'unsubscribe' }));
      };
    }
  }, [isReady, query]);

  useEffect(() => {
    if (socketRef.current && isReady) {
      socketRef.current.onmessage = event => {
        const eventData = JSON.parse(event.data);
        const events = eventData.result?.events;

        if (events) {
          switch (eventName) {
            case XCallEventType.CallMessage: {
              const destinationEventData = getXCallDestinationEventDataFromArchwayEvent(events);

              if (destinationEventData) {
                const originEvent = iconOriginEvents.find(e => e.sn === destinationEventData.sn);
                if (originEvent) {
                  addDestinationEvent('archway', { ...destinationEventData, autoExecute: originEvent.autoExecute });

                  if (originEvent.autoExecute) {
                    setListeningTo('archway', XCallEventType.CallExecuted);
                  }
                }
              }
              break;
            }
            case XCallEventType.CallExecuted: {
              const callExecutedEventData = getCallExecutedEventDataFromArchwayEvent(events);
              if (callExecutedEventData) {
                const destinationEvent = archwayDestinationEvents.find(e => e.reqId === callExecutedEventData.reqId);
                if (destinationEvent) {
                  stopListening();
                  if (callExecutedEventData.success) {
                    removeEvent(destinationEvent.sn, true);
                  } else {
                    rollBackFromOrigin(destinationEvent.origin, destinationEvent.sn);
                    setListeningTo(destinationEvent.origin, XCallEventType.RollbackMessage);
                  }
                }
              }
              break;
            }
            case XCallEventType.ResponseMessage: {
              console.log('TODO: logged event from ResponseMessage: ', events);
              break;
            }
            case XCallEventType.RollbackMessage: {
              const rollbackEventData = getRollbackEventDataFromArchwayEvent(events);

              if (rollbackEventData) {
                if (archwayOriginEvents.some(e => e.sn === parseInt(rollbackEventData.sn))) {
                  flagRollbackReady('archway', parseInt(rollbackEventData.sn));
                }
              }
              break;
            }
          }
        }
      };
    }
  }, [
    isReady,
    eventName,
    addDestinationEvent,
    iconOriginEvents,
    archwayDestinationEvents,
    archwayOriginEvents,
    flagRollbackReady,
    removeEvent,
    rollBackFromOrigin,
    setListeningTo,
    stopListening,
  ]);
};

export function getXCallResult(tx: CrossChainTxType): string | undefined {
  return tx.events.find(e => e.type === 'wasm-CallExecuted')?.attributes.find(a => a.key === 'msg')?.value;
}

export const useArchwayXCallFee = (): UseQueryResult<IXCallFee> => {
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
