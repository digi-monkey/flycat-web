/**
 * Asynchronously loads the component for HomePage
 */

import { lazyLoad } from 'utils/loadable';

export const BlogPage = lazyLoad(
  () => import('./index'),
  module => module.default,
);
