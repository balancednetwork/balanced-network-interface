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
  scanners: Partial<Record<string, any>>;

  isScannerEnabled: (id: string) => boolean;
  enableScanner: (id: string, xChainId: XChainId, startBlockHeight: bigint) => void;
  disableScanner: (id: string) => void;
  disableAllScanners: () => void;

  incrementCurrentHeight: (id: string) => void;
  updateChainHeight: (id: string) => Promise<void>;
  scanBlock: (xChainId: XChainId, blockHeight: bigint) => void;
  isScanned: (xChainId: XChainId, blockHeight: bigint) => boolean;
  setIsScanning: (id: string, isScanning: boolean) => void; // TODO: rename to setIsScanningBlock?
  getDestinationEvents: (xChainId: XChainId, sn: bigint) => Partial<Record<XCallEventType, XCallDestinationEvent>>;
};

export const useXCallEventStore = create<XCallEventStore>()(
  devtools(
    immer((set, get) => ({
      destinationXCallEvents: {},
      scanners: {},

      isScannerEnabled: (id: string) => {
        return get().scanners[id]?.enabled;
      },

      enableScanner: (id: string, xChainId: XChainId, startBlockHeight: bigint) => {
        set(state => {
          state.scanners[id] = {
            xChainId,
            enabled: true,
            isScanning: false,
            startBlockHeight,
            currentHeight: startBlockHeight,
            chainHeight: startBlockHeight,
          };
        });
      },
      disableScanner: (id: string) => {
        set(state => {
          state.scanners[id] = {
            ...state.scanners[id],
            enabled: false,
            isScanning: false,
            startBlockHeight: 0n,
            currentHeight: 0n,
            chainHeight: 0n,
          };
        });
      },
      disableAllScanners: () => {
        set(state => {
          state.scanners = {};
        });
      },

      incrementCurrentHeight: (id: string) => {
        const scanner = get().scanners[id];
        if (scanner.currentHeight >= scanner.chainHeight) {
          return;
        }

        set(state => {
          state.scanners[id].currentHeight += 1n;
        });
      },

      updateChainHeight: async (id: string) => {
        const scanner = get().scanners[id];
        if (scanner && scanner.xChainId) {
          const xCallService = xCallServiceActions.getXCallService(scanner.xChainId);
          const chainHeight = await xCallService.getBlockHeight();
          set(state => {
            state.scanners[id].chainHeight = chainHeight;
          });
        }
      },

      isScanned: (xChainId: XChainId, blockHeight: bigint) => {
        return !!get().destinationXCallEvents[xChainId]?.[Number(blockHeight)];
      },

      scanBlock: async (xChainId: XChainId, blockHeight: bigint) => {
        if (get().isScanned(xChainId, blockHeight)) {
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

      setIsScanning: (id: string, isScanning: boolean) => {
        set(state => {
          state.scanners[id].isScanning = isScanning;
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
  enableScanner: (id: string, xChainId: XChainId, startBlockHeight: bigint) => {
    useXCallEventStore.getState().enableScanner(id, xChainId, startBlockHeight);
  },
  disableScanner: (id: string) => {
    useXCallEventStore.getState().disableScanner(id);
  },

  disableAllScanners: () => {
    useXCallEventStore.getState().disableAllScanners();
  },

  incrementCurrentHeight: async (id: string) => {
    useXCallEventStore.getState().incrementCurrentHeight(id);
  },
  updateChainHeight: async (id: string) => {
    await useXCallEventStore.getState().updateChainHeight(id);
  },

  isScanned: (xChainId: XChainId, blockHeight: bigint) => {
    return useXCallEventStore.getState().isScanned(xChainId, blockHeight);
  },

  scanBlock: async (xChainId: XChainId, blockHeight: bigint) => {
    await useXCallEventStore.getState().scanBlock(xChainId, blockHeight);
  },

  setIsScanning: (id: string, isScanning: boolean) => {
    useXCallEventStore.getState().setIsScanning(id, isScanning);
  },

  getDestinationEvents: (xChainId: XChainId, sn: bigint) => {
    return useXCallEventStore.getState().getDestinationEvents(xChainId, sn);
  },
};

// TODO: improve performance
export const useXCallEventScanner = (id: string | undefined) => {
  const { startTimer, stopTimer } = useTimerStore();
  const { scanners } = useXCallEventStore();
  const scanner = id ? scanners?.[id] : null;
  const { xChainId, enabled } = scanner || {};

  const scanFn = useCallback(async () => {
    if (!enabled || !xChainId || !id) {
      return;
    }

    const scanner = useXCallEventStore.getState().scanners[id];

    if (scanner.isScanning) {
      return;
    }

    xCallEventActions.setIsScanning(id, true);

    try {
      const { currentHeight } = useXCallEventStore.getState().scanners[id] || {};

      // console.log('Scanning block:', currentHeight);
      await xCallEventActions.scanBlock(xChainId, currentHeight);
      await xCallEventActions.updateChainHeight(id);

      if (xCallEventActions.isScanned(xChainId, currentHeight)) {
        await xCallEventActions.incrementCurrentHeight(id);
      }
    } catch (error) {
      console.error('Error during block scan:', error);
    } finally {
      xCallEventActions.setIsScanning(id, false);
    }
  }, [id, xChainId, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    startTimer(id, scanFn);
    return () => {
      stopTimer(id);
    };
  }, [id, enabled, scanFn, startTimer, stopTimer]);
};
