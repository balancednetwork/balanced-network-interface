import { useEffect } from 'react';
import { create } from 'zustand';

import { XCallEventType, XChainId } from 'app/_xcall/types';
import { XCallEvent } from './types';
import { xCallServiceActions } from './useXCallServiceStore';

type XCallEventStore = {
  destinationXCallEvents: Partial<Record<XChainId, Record<number, XCallEvent[]>>>;
  scanners: Partial<Record<XChainId, any>>;
};

export const useXCallEventStore = create<XCallEventStore>()(set => ({
  destinationXCallEvents: {},
  scanners: {},
}));

export const xCallEventActions = {
  startScanner: (xChainId: XChainId, startBlockHeight: number) => {
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

  incrementCurrentHeight: (xChainId: XChainId) => {
    console.log('incrementCurrentHeight', xChainId);
    try {
      if (
        useXCallEventStore.getState().scanners[xChainId].currentHeight >=
        useXCallEventStore.getState().scanners[xChainId].chainHeight
      ) {
        return;
      }
      console.log('incrementing currentHeight', xChainId);
      useXCallEventStore.setState(state => {
        state.scanners[xChainId].currentHeight += 1;
        return state;
      });
    } catch (e) {}
  },
  updateChainHeight: async (xChainId: XChainId) => {
    console.log('updateChainHeight', xChainId);
    try {
      const xCallService = xCallServiceActions.getXCallService(xChainId);
      const chainHeight = await xCallService.fetchBlockHeight();
      useXCallEventStore.setState(state => {
        state.scanners[xChainId].chainHeight = chainHeight;
        return state;
      });
    } catch (e) {}
  },

  scanBlock: async (xChainId: XChainId, blockHeight: number) => {
    if (useXCallEventStore.getState().destinationXCallEvents?.[xChainId]?.[blockHeight]) {
      return;
    }

    const xCallService = xCallServiceActions.getXCallService(xChainId);
    const events = await xCallService.fetchDestinationEventsByBlock(blockHeight);

    useXCallEventStore.setState(state => {
      state.destinationXCallEvents ??= {};
      state.destinationXCallEvents[xChainId] ??= {};

      // @ts-ignore
      state.destinationXCallEvents[xChainId][blockHeight] = events;

      return state;
    });
  },

  getDestinationEvents: (xChainId: XChainId, sn: number) => {
    const events = useXCallEventStore.getState().destinationXCallEvents?.[xChainId];

    const result = {};
    for (const blockHeight in events) {
      for (const event of events[blockHeight]) {
        if (event.sn === sn) {
          result[event.eventType] = event;
        }
      }
    }

    const callMessageEvent = result[XCallEventType.CallMessage];
    if (callMessageEvent) {
      for (const blockHeight in events) {
        for (const event of events[blockHeight]) {
          if (event.reqId === callMessageEvent.reqId) {
            result[event.eventType] = event;
          }
        }
      }
    }

    return result;
  },
};

export const useXCallEventScanner = (xChainId: XChainId) => {
  const { scanners } = useXCallEventStore();
  const scanner = scanners?.[xChainId];
  const { enabled, currentHeight, chainHeight } = scanner || {};

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setTimeout(() => {
      if (enabled) {
        xCallEventActions.incrementCurrentHeight(xChainId);
      }
    }, 100);
  }, [xChainId, enabled, chainHeight]);

  //update chainHeight every 1 second
  useEffect(() => {
    const updateChainHeight = async () => {
      if (enabled) {
        await xCallEventActions.updateChainHeight(xChainId);
      }
    };

    const interval = setInterval(updateChainHeight, 1000);

    return () => clearInterval(interval);
  }, [xChainId, enabled]);

  useEffect(() => {
    const scan = async () => {
      if (!enabled) {
        return;
      }

      console.log('scanning block', currentHeight);

      await xCallEventActions.scanBlock(xChainId, currentHeight);
    };

    scan();
  }, [xChainId, enabled, currentHeight]);
};
