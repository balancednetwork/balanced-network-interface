import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { XCallEvent } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { useTimerStore } from './useTimerStore';

type XCallEventStore = {
  destinationXCallEvents: Partial<Record<XChainId, Record<number, XCallEvent[]>>>;
  scanners: Partial<Record<XChainId, any>>;
};

export const useXCallEventStore = create<XCallEventStore>()(set => ({
  destinationXCallEvents: {},
  scanners: {},
}));

export const xCallEventActions = {
  isScannerEnabled: (xChainId: XChainId) => {
    return useXCallEventStore.getState().scanners[xChainId]?.enabled;
  },
  startScanner: (xChainId: XChainId, startBlockHeight: bigint) => {
    console.log('start scanner');
    useXCallEventStore.setState(state => {
      state.scanners[xChainId] = {
        enabled: true,
        startBlockHeight,
        currentHeight: startBlockHeight,
        chainHeight: startBlockHeight,
      };
      return state;
    });
  },
  stopScanner: (xChainId: XChainId) => {
    console.log('stop scanner');
    useXCallEventStore.setState(state => {
      state.scanners[xChainId] = {
        enabled: false,
        startBlockHeight: 0,
        currentHeight: 0,
        chainHeight: 0,
      };
      return state;
    });
  },

  stopAllScanners: () => {
    console.log('stop all scanners');
    useXCallEventStore.setState(state => {
      state.scanners = {};
      return state;
    });
  },

  setScanner: (xChainId, data) => {
    useXCallEventStore.setState(state => {
      state.scanners[xChainId] = {
        ...state.scanners[xChainId],
        ...data,
      };
      return state;
    });
  },

  incrementCurrentHeight: async (xChainId: XChainId) => {
    // console.log('incrementCurrentHeight', xChainId);
    try {
      if (
        useXCallEventStore.getState().scanners[xChainId].currentHeight >=
        useXCallEventStore.getState().scanners[xChainId].chainHeight
      ) {
        return;
      }

      useXCallEventStore.setState(prevState => ({
        ...prevState,
        scanners: {
          ...prevState.scanners,
          [xChainId]: {
            ...prevState.scanners[xChainId],
            currentHeight: prevState.scanners[xChainId].currentHeight + 1n,
          },
        },
      }));
    } catch (e) {
      console.log(e);
    }
  },
  updateChainHeight: async (xChainId: XChainId) => {
    // console.log('updateChainHeight', xChainId);
    try {
      const xCallService = xCallServiceActions.getXCallService(xChainId);
      const chainHeight = await xCallService.getBlockHeight();
      useXCallEventStore.setState(prevState => ({
        ...prevState,
        scanners: {
          ...prevState.scanners,
          [xChainId]: {
            ...prevState.scanners[xChainId],
            chainHeight,
          },
        },
      }));
    } catch (e) {
      console.log(e);
    }
  },

  scanBlock: async (xChainId: XChainId, blockHeight: bigint) => {
    if (useXCallEventStore.getState().destinationXCallEvents?.[xChainId]?.[Number(blockHeight)]) {
      return;
    }

    const xCallService = xCallServiceActions.getXCallService(xChainId);
    const events = await xCallService.getDestinationEventsByBlock(blockHeight);

    useXCallEventStore.setState(state => {
      state.destinationXCallEvents ??= {};
      state.destinationXCallEvents[xChainId] ??= {};

      // @ts-ignore
      state.destinationXCallEvents[xChainId][blockHeight] = events;

      return state;
    });
  },

  getDestinationEvents: (xChainId: XChainId, sn: bigint) => {
    try {
      const events = useXCallEventStore.getState().destinationXCallEvents?.[xChainId];

      console.log('getDestinationEvents', xChainId, sn, events);

      const result = {};

      for (const blockHeight in events) {
        if (events[blockHeight]) {
          for (const event of events[blockHeight]) {
            if (event.sn === sn) {
              result[event.eventType] = event;
            }
          }
        }
      }

      const callMessageEvent = result[XCallEventType.CallMessage];
      if (callMessageEvent) {
        for (const blockHeight in events) {
          if (events[blockHeight]) {
            for (const event of events[blockHeight]) {
              if (event.reqId === callMessageEvent.reqId) {
                result[event.eventType] = event;
              }
            }
          }
        }
      }

      return result;
    } catch (e) {
      console.log(e);
    }
    return {};
  },
};

// TODO: improve performance
export const useXCallEventScanner = (xChainId: XChainId | undefined) => {
  const { startTimer, stopTimer } = useTimerStore();
  const { scanners } = useXCallEventStore();
  const scanner = xChainId ? scanners?.[xChainId] : null;
  const { enabled } = scanner || {};

  const scanFn = useCallback(async () => {
    console.log('scan', xChainId, enabled);
    if (!enabled || !xChainId) {
      return;
    }

    const { currentHeight } = useXCallEventStore.getState().scanners[xChainId] || {};
    console.log('scan started', xChainId, useXCallEventStore.getState().scanners, currentHeight);

    await xCallEventActions.scanBlock(xChainId, currentHeight);
    await xCallEventActions.updateChainHeight(xChainId);
    await xCallEventActions.incrementCurrentHeight(xChainId);
  }, [xChainId, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    startTimer(xChainId, scanFn);
    return () => {
      stopTimer(xChainId);
    };
  }, [xChainId, enabled, scanFn, startTimer, stopTimer]);
};
