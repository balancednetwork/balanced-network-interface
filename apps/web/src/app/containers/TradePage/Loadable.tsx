import { lazyLoad } from 'utils/loadable';

export const TradePage = lazyLoad(
  () => import('./index'),
  module => module.TradePage,
);
