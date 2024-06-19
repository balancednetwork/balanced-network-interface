import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useQuery } from '@tanstack/react-query';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { XCallExecutedEvent, XCallMessageEvent, XCallDestinationEvent } from './types';
import { xServiceActions } from './useXServiceStore';

type XCallScanner = {
  id: string;
  enabled: boolean;
  xChainId: XChainId;
  isScanning: boolean;
  startBlockHeight: bigint;
  currentHeight: bigint;
  chainHeight: bigint;
};

type XCallDestinationEventMap = Partial<{
  [XCallEventType.CallMessage]: XCallMessageEvent;
  [XCallEventType.CallExecuted]: XCallExecutedEvent;
}>;

type XCallEventStore = {
  destinationXCallEvents: Partial<Record<XChainId, XCallDestinationEvent[]>>;
  scannedBlocks: Partial<Record<XChainId, Record<string, boolean>>>;
  scanners: Record<string, XCallScanner>;

  isScannerEnabled: (id: string) => boolean;
  enableScanner: (id: string, xChainId: XChainId, startBlockHeight: bigint) => void;
  disableScanner: (id: string) => void;
  disableAllScanners: () => void;

  incrementCurrentHeight: (id: string, step: bigint) => void;
  updateChainHeight: (id: string) => Promise<void>;
  // scanBlock: (xChainId: XChainId, blockHeight: bigint) => void;
  scanBlocks: (id: string, xChainId: XChainId) => Promise<void>;
  isScanned: (xChainId: XChainId, blockHeight: bigint) => boolean;
  setIsScanning: (id: string, isScanning: boolean) => void; // TODO: rename to setIsScanningBlock?
  getDestinationEvents: (xChainId: XChainId, sn: bigint) => XCallDestinationEventMap;
};

export const useXCallEventStore = create<XCallEventStore>()(
  devtools(
    immer((set, get) => ({
      destinationXCallEvents: {},
      scannedBlocks: {},
      scanners: {},

      isScannerEnabled: (id: string) => {
        return get().scanners[id]?.enabled;
      },

      enableScanner: (id: string, xChainId: XChainId, startBlockHeight: bigint) => {
        set(state => {
          state.scanners[id] = {
            id,
            enabled: true,
            xChainId,
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

      incrementCurrentHeight: (id: string, step = 1n) => {
        set(state => {
          const newCurrentHeight = state.scanners[id].currentHeight + step;
          if (newCurrentHeight > state.scanners[id].chainHeight) {
            state.scanners[id].currentHeight = state.scanners[id].chainHeight;
          } else {
            state.scanners[id].currentHeight = newCurrentHeight;
          }
        });
      },

      updateChainHeight: async (id: string) => {
        const scanner = get().scanners[id];
        if (scanner && scanner.xChainId) {
          const xService = xServiceActions.getPublicXService(scanner.xChainId);
          const chainHeight = await xService.getBlockHeight();
          set(state => {
            state.scanners[id].chainHeight = chainHeight;
          });
        }
      },

      isScanned: (xChainId: XChainId, blockHeight: bigint) => {
        return !!get().scannedBlocks[xChainId]?.[blockHeight.toString()];
      },

      scanBlocks: async (id: string, xChainId: XChainId) => {
        const scanner = get().scanners[id];

        if (!scanner) {
          return;
        }

        let currentHeight = scanner.currentHeight;

        while (currentHeight < scanner.chainHeight) {
          if (get().isScanned(xChainId, currentHeight)) {
            currentHeight += 1n;
          } else {
            break;
          }
        }

        const xService = xServiceActions.getPublicXService(xChainId);

        let scanBlockCount = xService.getScanBlockCount();
        if (currentHeight + scanBlockCount > scanner.chainHeight) {
          scanBlockCount = scanner.chainHeight - currentHeight + 1n;
        }

        const startBlockHeight: bigint = currentHeight;
        const endBlockHeight: bigint = currentHeight + scanBlockCount - 1n;
        // console.log('Scanning blocks:', startBlockHeight, endBlockHeight);
        if (
          startBlockHeight === endBlockHeight &&
          endBlockHeight === currentHeight &&
          get().isScanned(xChainId, currentHeight)
        ) {
          // console.log('Block already scanned:', currentHeight);
          return;
        }

        const events = await xService.getDestinationEvents({ startBlockHeight, endBlockHeight });
        // console.log('events', events);

        if (events) {
          set(state => {
            state.destinationXCallEvents ??= {};
            state.destinationXCallEvents[xChainId] ??= [];

            // @ts-ignore
            state.destinationXCallEvents[xChainId] = [...state.destinationXCallEvents[xChainId], ...events];

            for (let i = currentHeight; i < currentHeight + scanBlockCount; i += 1n) {
              state.scannedBlocks[xChainId] ??= {};

              // @ts-ignore
              state.scannedBlocks[xChainId][i.toString()] = true;
            }
          });

          get().incrementCurrentHeight(id, scanBlockCount);
        }
      },

      setIsScanning: (id: string, isScanning: boolean) => {
        set(state => {
          state.scanners[id].isScanning = isScanning;
        });
      },

      getDestinationEvents: (xChainId: XChainId, sn: bigint) => {
        const events = get().destinationXCallEvents?.[xChainId];

        if (!events) {
          return {};
        }

        const result = {};
        for (const event of events) {
          if ((event as XCallMessageEvent).sn === sn) {
            result[event.eventType] = event;
          }
        }

        const callMessageEvent = result[XCallEventType.CallMessage];
        if (callMessageEvent) {
          for (const event of events) {
            if (event.reqId === callMessageEvent.reqId) {
              result[event.eventType] = event;
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
  isScannerEnabled: (id: string) => {
    return useXCallEventStore.getState().isScannerEnabled(id);
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

  incrementCurrentHeight: async (id: string, step: bigint) => {
    useXCallEventStore.getState().incrementCurrentHeight(id, step);
  },
  updateChainHeight: async (id: string) => {
    await useXCallEventStore.getState().updateChainHeight(id);
  },

  isScanned: (xChainId: XChainId, blockHeight: bigint) => {
    return useXCallEventStore.getState().isScanned(xChainId, blockHeight);
  },

  scanBlocks: async (id: string, xChainId: XChainId) => {
    await useXCallEventStore.getState().scanBlocks(id, xChainId);
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
  const { scanners } = useXCallEventStore();
  const scanner = id ? scanners?.[id] : null;

  useQuery({
    queryKey: ['xCallEventScanner', id],
    queryFn: async () => {
      // const scanner = useXCallEventStore.getState().scanners[id];
      if (!scanner || !scanner.enabled) {
        return null;
      }

      if (scanner.isScanning) {
        return null;
      }

      const { id, xChainId } = scanner;

      xCallEventActions.setIsScanning(id, true);

      try {
        await xCallEventActions.scanBlocks(id, xChainId);
        await xCallEventActions.updateChainHeight(id);
      } catch (error) {
        console.error('Error during block scan:', error);
      } finally {
        xCallEventActions.setIsScanning(id, false);
      }

      return { id, xChainId };
    },
    enabled: !!scanner && scanner?.enabled,
    refetchInterval: 1000,
  });
};
