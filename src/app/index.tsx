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
        <Route path="/blog/:publicKey">
          <BlogPage />
        </Route>
        <Route path="/user/:publicKey">
          <ProfilePage />
        </Route>
        <Route path="/event/:eventId">
          <EventPage />
        </Route>
        <Route exact path="/" component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
      <GlobalStyle />
    </BrowserRouter>
  );
}
