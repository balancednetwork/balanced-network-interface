import React from 'react';

import { useQuery, UseQueryResult } from 'react-query';

import bnJs from 'bnJs';
import { useBlockNumber } from 'store/application/hooks';
import {
  useAddDestinationEvent,
  useAddOriginEvent,
  useRemoveEvent,
  useRollBackFromOrigin,
  useSetListeningTo,
  useStopListening,
  useXCallDestinationEvents,
  useXCallListeningTo,
  useXCallOriginEvents,
} from 'store/xCall/hooks';

import { XCallEventType } from '../types';
import { ARCHWAY_XCALL_NETWORK_ID, ICON_WEBSOCKET_URL } from './config';
import {
  getCallMessageSentEventFromLogs,
  getICONEventSignature,
  getTxFromCallExecutedLog,
  getXCallOriginEventDataFromICON,
} from './utils';

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

export const useICONEventListener = () => {
  const listeningTo = useXCallListeningTo();
  const setListeningTo = useSetListeningTo();
  const eventName: XCallEventType | null = listeningTo?.chain === 'icon' ? listeningTo.event : null;
  const iconBlockHeight = useBlockNumber();
  const blockHeightRef = React.useRef<string | null>(null);
  const addDestinationEvent = useAddDestinationEvent();
  const archwayOriginEvents = useXCallOriginEvents('archway');
  const iconDestinationEvents = useXCallDestinationEvents('icon');
  // const xCallState = useXCallState();
  const removeEvent = useRemoveEvent();
  const stopListening = useStopListening();
  const rollBackFromOrigin = useRollBackFromOrigin();
  const addOriginEvent = useAddOriginEvent();

  React.useEffect(() => {
    if (iconBlockHeight) {
      if (!blockHeightRef.current) {
        blockHeightRef.current = `0x${iconBlockHeight.toString(16)}`;
      }
    } else {
      blockHeightRef.current = null;
    }
  }, [iconBlockHeight, event]);

  React.useEffect(() => {
    if (eventName) {
      const websocket = new WebSocket(ICON_WEBSOCKET_URL);

      const eventSignature = getICONEventSignature(eventName);
      const query = {
        height: blockHeightRef.current,
        eventFilters: [
          {
            event: eventSignature,
            addr: bnJs.XCall.address,
          },
        ],
        logs: '0x1',
      };

      websocket.onopen = () => {
        websocket.send(JSON.stringify(query));
      };

      websocket.onmessage = async event => {
        const eventData = JSON.parse(event.data);

        if (eventData) {
          switch (eventName) {
            case XCallEventType.CallMessage: {
              if (eventData.logs) {
                const callMessageLog =
                  eventData.logs &&
                  eventData.logs[0][0].find(
                    log => log.indexed[0] === getICONEventSignature(XCallEventType.CallMessage),
                  );
                if (callMessageLog) {
                  const snRaw = callMessageLog.indexed[3];
                  const sn = snRaw && parseInt(snRaw, 16);
                  const reqId = parseInt(callMessageLog.data[0], 16);
                  const data = callMessageLog.data[1];
                  //todo: handle parsing from above like the line below
                  // const destinationEventData = getDestinationEventDataFromICONEvent(callMessageLog);
                  if (sn && reqId) {
                    //todo find origin event from arbitrary chain - not archway only
                    const originEvent = archwayOriginEvents.find(e => e.sn === sn);
                    if (originEvent) {
                      addDestinationEvent('icon', {
                        sn,
                        reqId,
                        data,
                        eventName: XCallEventType.CallMessage,
                        chain: 'icon',
                        origin: 'archway',
                        autoExecute: originEvent.autoExecute,
                      });

                      if (originEvent.autoExecute) {
                        setListeningTo('icon', XCallEventType.CallExecuted);
                      }
                    }
                  }
                }
              }
              break;
            }
            case XCallEventType.CallExecuted: {
              if (eventData.logs) {
                const blockHeight = eventData.height;
                const indexes = eventData.indexes;
                const executeCallLog =
                  eventData.logs &&
                  eventData.logs[0][0].find(
                    log => log.indexed[0] === getICONEventSignature(XCallEventType.CallExecuted),
                  );
                if (executeCallLog) {
                  const reqIdRaw = executeCallLog.indexed[1];
                  const reqId = parseInt(executeCallLog.indexed[1], 16);
                  const success = executeCallLog.data[0] === '0x1';

                  if (reqId) {
                    const destinationEvent = iconDestinationEvents.find(e => e.reqId === reqId);
                    const tx = await getTxFromCallExecutedLog(blockHeight, indexes, reqIdRaw);
                    if (tx) {
                      if (success) {
                        //check for callMessageSent event
                        const callMessageSentLog = getCallMessageSentEventFromLogs(tx.eventLogs);
                        if (callMessageSentLog) {
                          //todo: find the destination event and determine destination for this new origin event
                          //todo: fill description from the destination event as well
                          const originEventData = getXCallOriginEventDataFromICON(
                            callMessageSentLog,
                            'archway',
                            'Swap',
                            '',
                          );

                          destinationEvent && removeEvent(destinationEvent.sn, false);
                          //add new origin event
                          originEventData && addOriginEvent('icon', originEventData);
                        } else {
                          destinationEvent && removeEvent(destinationEvent.sn, true);
                          stopListening();
                        }
                      } else {
                        if (destinationEvent) {
                          //todo: not tested yet
                          rollBackFromOrigin(destinationEvent.origin, destinationEvent.sn);
                          setListeningTo(destinationEvent.origin, XCallEventType.RollbackMessage);
                        }
                      }
                    }
                  }
                }
              }
              break;
            }
            case XCallEventType.ResponseMessage: {
              break;
            }
            case XCallEventType.RollbackMessage: {
              break;
            }
          }
        }
      };

      websocket.onerror = error => {
        console.error(error);
      };

      websocket.onclose = () => {};

      return () => {
        websocket.close();
      };
    }
  }, [
    eventName,
    addDestinationEvent,
    archwayOriginEvents,
    iconDestinationEvents,
    removeEvent,
    setListeningTo,
    stopListening,
    rollBackFromOrigin,
    addOriginEvent,
  ]);
};

export const useIconXCallFee = (): UseQueryResult<{ noRollback: string; rollback: string }> => {
  return useQuery(
    `icon-xcall-fees`,
    async () => {
      const feeWithRollback = await bnJs.XCall.getFee(ARCHWAY_XCALL_NETWORK_ID, true);
      const feeNoRollback = await bnJs.XCall.getFee(ARCHWAY_XCALL_NETWORK_ID, false);

      return {
        noRollback: feeNoRollback,
        rollback: feeWithRollback,
      };
    },
    { keepPreviousData: true },
  );
};
