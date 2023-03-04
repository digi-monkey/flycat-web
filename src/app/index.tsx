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
import { BlogPage } from './pages/legacy-blog/Loadable';
import { ContactPage } from './pages/ContactPage/Loadable';
import RelayManager from './components/layout/relay/RelayManager';
import { ArticleRead } from './pages/ArticleReadPage/ArticleRead';
import BlogFeed from './pages/legacy-blog/Feed';
import Backup from './pages/Backup/Backup';
import Notification from './pages/Notification/Notification';
import { BlogFeedPage } from './pages/Blog/FeedPage';
import { NewArticle } from './pages/Blog/Article';
import Writer from './pages/Blog/Write';
import Edit from './pages/Blog/Edit';
import PersonalBlog from './pages/Blog/Personal';
import EditProfilePage from './pages/Setting/Setting';
import Universe from './pages/Universe/Universe';

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
        <Route path="/universe">
          <Universe />
        </Route>

        <Route path="/setting">
          <EditProfilePage />
        </Route>

        <Route path="/blog/:publicKey">
          <PersonalBlog />
        </Route>

        <Route path="/write">
          <Writer />
        </Route>

        <Route path="/blog">
          <BlogFeedPage />
        </Route>

        <Route path="/edit/:publicKey/:articleId">
          <Edit />
        </Route>

        <Route path="/post/:publicKey/:articleId?">
          <NewArticle />
        </Route>

        <Route path="/notification">
          <Notification />
        </Route>

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
        <Route path="/legacy-blog/:publicKey">
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
        <Route exact path="/legacy-blog">
          <BlogFeed />
        </Route>
        <Route exact path="/" component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
      <GlobalStyle />
    </BrowserRouter>
  );
}
