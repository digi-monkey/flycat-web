/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import { GlobalStyle } from 'styles/global-styles';

import { HomePage } from './pages/HomePage/Loadable';
import { NotFoundPage } from './components/NotFoundPage/Loadable';
import { useTranslation } from 'react-i18next';
import { ProfilePage } from './pages/ProfilePage/Loadable';
import { EventPage } from './pages/EventPage/Loadable';
import { BlogPage } from './pages/BlogPage/Loadable';
import { ContactPage } from './pages/ContactPage/Loadable';
import RelayManager from './components/layout/relay/RelayManager';
import { ArticleRead } from './pages/ArticleReadPage/ArticleRead';
import BlogFeed from './pages/BlogPage/Feed';
import Backup from './pages/Backup/Backup';

export function App() {
  const { i18n } = useTranslation();
  return (
    <BrowserRouter>
      <Helmet
        titleTemplate="%s - nostr web client"
        defaultTitle="Flycat nostr web client"
        htmlAttributes={{ lang: i18n.language }}
      >
        <meta name="description" content="A nostr web client" />
      </Helmet>

      <Switch>
        <Route path="/article/:publicKey/:articleId">
          <ArticleRead />
        </Route>
        <Route path="/backup">
          <Backup />
        </Route>
        <Route path="/relay">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <RelayManager />
          </div>
        </Route>
        <Route path="/blog/:publicKey">
          <BlogPage />
        </Route>
        <Route path="/contact/:publicKey">
          <ContactPage />
        </Route>
        <Route path="/user/:publicKey">
          <ProfilePage />
        </Route>
        <Route path="/event/:eventId">
          <EventPage />
        </Route>
        <Route exact path="/blog">
          <BlogFeed />
        </Route>
        <Route exact path="/" component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
      <GlobalStyle />
    </BrowserRouter>
  );
}
