import { lazyLoad } from 'utils/loadable';

export const VotePage = lazyLoad(
  () => import('./index'),
  module => module.VotePage,
);
