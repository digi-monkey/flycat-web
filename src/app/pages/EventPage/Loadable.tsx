/**
 * Asynchronously loads the component for HomePage
 */

import { lazyLoad } from 'utils/loadable';

export const EventPage = lazyLoad(
  () => import('./index'),
  module => module.default,
);
