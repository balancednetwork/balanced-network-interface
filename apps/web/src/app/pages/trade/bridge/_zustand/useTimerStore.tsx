import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type TimerStore = {
  timers: Record<any, any>;
  startTimer: (id: any, timerFn: () => void) => void;
  stopTimer: (id: any) => void;
};

export const useTimerStore = create<TimerStore>()(
  immer((set, get) => ({
    timers: {},
    startTimer: (id, timerFn) => {
      if (!id) return;

      const intervalId = get().timers[id];
      if (intervalId) {
        clearInterval(intervalId);
      }

      const newIntervalId = setInterval(timerFn, 2000);

      set(state => {
        state.timers[id] = newIntervalId;
      });
    },
    stopTimer: id => {
      if (!id) return;

      const intervalId = get().timers[id];
      if (intervalId) {
        clearInterval(intervalId);
      } else {
        return;
      }

      set(state => {
        state.timers[id] = null;
      });
    },
  })),
);
