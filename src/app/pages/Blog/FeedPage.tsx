import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import React from 'react';
import { BlogFeeds } from './Feed';

export function BlogFeedPage() {
  return (
    <BaseLayout>
      <Left>
        <BlogFeeds />
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}
