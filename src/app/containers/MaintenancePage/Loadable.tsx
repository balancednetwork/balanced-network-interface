import { lazyLoad } from 'utils/loadable';

export const MaintenancePage = lazyLoad(
  () => import('./index'),
  module => module.MaintenancePage,
);
