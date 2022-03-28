import { init } from '@rematch/core';
import loadingPlugin from '@rematch/loading';
import selectPlugin from '@rematch/select';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

import * as models from './models';

export const history = createBrowserHistory();

const reducers = { router: connectRouter(history) };

const store = init({
  redux: {
    reducers,
    middlewares: [routerMiddleware(history)],
  },
  models,
  plugins: [loadingPlugin(), selectPlugin()],
});

export default store;
