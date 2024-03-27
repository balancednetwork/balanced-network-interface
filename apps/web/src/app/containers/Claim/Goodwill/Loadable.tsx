import { lazyLoad } from 'utils/loadable';

export const ClaimGoodwill = lazyLoad(
  () => import('./index'),
  module => module.ClaimGoodwill,
);
