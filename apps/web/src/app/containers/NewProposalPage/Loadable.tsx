import { lazyLoad } from 'utils/loadable';

export const NewProposalPage = lazyLoad(
  () => import('./index'),
  module => module.NewProposalPage,
);
