import { useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type XCallScannerStore = {
  messages: Record<string, any>;
};

export const useXCallScannerStore = create<XCallScannerStore>()(
  immer((set, get) => ({
    messages: {},
  })),
);

export const useXCallScannerSubscription = () => {
  useEffect(() => {
    console.log('useXCallScannerSubscription');
    const websocket = new WebSocket('wss://xcallscan.xyz/ws');
    websocket.onopen = () => {
      console.log('connected');
    };
    websocket.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log('websocket received:', data);
      if (data.src_tx_hash) {
        useXCallScannerStore.setState(state => {
          state.messages[data.src_tx_hash] = data;
        });
      }
    };

    return () => {
      websocket.close();
    };
  }, []);
};
