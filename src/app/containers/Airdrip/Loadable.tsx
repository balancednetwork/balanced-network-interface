/**
 * Asynchronously loads the component for HomePage
 */

import { lazyLoad } from 'utils/loadable';

export const Airdrip = lazyLoad(
  () => import('./index'),
  module => module.Airdrip,
);
