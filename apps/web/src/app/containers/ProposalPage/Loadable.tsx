import { lazyLoad } from 'utils/loadable';

export const ProposalPage = lazyLoad(
  () => import('./index'),
  module => module.ProposalPage,
);
