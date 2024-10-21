import { configureAppStore } from './configureStore';

const store = configureAppStore();

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
