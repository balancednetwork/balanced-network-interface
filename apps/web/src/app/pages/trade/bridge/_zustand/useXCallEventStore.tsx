import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { XCallDestinationEvent, XCallEvent } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { useTimerStore } from './useTimerStore';

type XCallEventStore = {
  destinationXCallEvents: Partial<Record<XChainId, Record<number, XCallDestinationEvent[]>>>;
  scanners: Partial<Record<XChainId, any>>;

  isScannerEnabled: (xChainId: XChainId) => boolean;
  startScanner: (xChainId: XChainId, startBlockHeight: bigint) => void;
  stopScanner: (xChainId: XChainId) => void;
  stopAllScanners: () => void;

  incrementCurrentHeight: (xChainId: XChainId) => void;
  updateChainHeight: (xChainId: XChainId) => Promise<void>;
  scanBlock: (xChainId: XChainId, blockHeight: bigint) => void;
  getDestinationEvents: (xChainId: XChainId, sn: bigint) => Partial<Record<XCallEventType, XCallDestinationEvent>>;
};

export const useXCallEventStore = create<XCallEventStore>()(
  devtools(
    immer((set, get) => ({
      destinationXCallEvents: {},
      scanners: {},

      isScannerEnabled: (xChainId: XChainId) => {
        return get().scanners[xChainId]?.enabled;
      },

      startScanner: (xChainId: XChainId, startBlockHeight: bigint) => {
        set(state => {
          state.scanners[xChainId] = {
            enabled: true,
            startBlockHeight,
            currentHeight: startBlockHeight,
            chainHeight: startBlockHeight,
          };
        });
      },
      stopScanner: (xChainId: XChainId) => {
        set(state => {
          state.scanners[xChainId] = {
            enabled: false,
            startBlockHeight: 0,
            currentHeight: 0,
            chainHeight: 0,
          };
        });
      },
      stopAllScanners: () => {
        set(state => {
          state.scanners = {};
        });
      },

      incrementCurrentHeight: (xChainId: XChainId) => {
        const scanner = get().scanners[xChainId];
        if (scanner.currentHeight >= scanner.chainHeight) {
          return;
        }

        set(state => {
          state.scanners[xChainId].currentHeight += 1n;
        });
      },

      updateChainHeight: async (xChainId: XChainId) => {
        const xCallService = xCallServiceActions.getXCallService(xChainId);
        const chainHeight = await xCallService.getBlockHeight();
        set(state => {
          state.scanners[xChainId].chainHeight = chainHeight;
        });
      },

      scanBlock: async (xChainId: XChainId, blockHeight: bigint) => {
        if (get().destinationXCallEvents[xChainId]?.[Number(blockHeight)]) {
          return;
        }

        const xCallService = xCallServiceActions.getXCallService(xChainId);
        const events = await xCallService.getDestinationEventsByBlock(blockHeight);

        set(state => {
          state.destinationXCallEvents ??= {};
          state.destinationXCallEvents[xChainId] ??= {};

          // @ts-ignore
          state.destinationXCallEvents[xChainId][blockHeight] = events;
        });
      },

      getDestinationEvents: (xChainId: XChainId, sn: bigint) => {
        const events = get().destinationXCallEvents?.[xChainId];

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
      },
    })),
    { name: 'XCallEventStore' },
  ),
);

export const xCallEventActions = {
  isScannerEnabled: (xChainId: XChainId) => {
    return useXCallEventStore.getState().isScannerEnabled(xChainId);
  },
  startScanner: (xChainId: XChainId, startBlockHeight: bigint) => {
    useXCallEventStore.getState().startScanner(xChainId, startBlockHeight);
  },
  stopScanner: (xChainId: XChainId) => {
    useXCallEventStore.getState().stopScanner(xChainId);
  },

  stopAllScanners: () => {
    useXCallEventStore.getState().stopAllScanners();
  },

  incrementCurrentHeight: async (xChainId: XChainId) => {
    useXCallEventStore.getState().incrementCurrentHeight(xChainId);
  },
  updateChainHeight: async (xChainId: XChainId) => {
    await useXCallEventStore.getState().updateChainHeight(xChainId);
  },

  scanBlock: async (xChainId: XChainId, blockHeight: bigint) => {
    await useXCallEventStore.getState().scanBlock(xChainId, blockHeight);
  },

  getDestinationEvents: (xChainId: XChainId, sn: bigint) => {
    return useXCallEventStore.getState().getDestinationEvents(xChainId, sn);
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
