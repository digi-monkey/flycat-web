import { NextSeo } from 'next-seo';
import { HomePage } from './home/Loadable';
import {serverSideTranslations} from "next-i18next/serverSideTranslations";

export default function App() {
  return (
    <>
      <NextSeo title='flycat' description='A nostr web client' />
      <HomePage />
    </>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})


{/* <BrowserRouter>
      <Helmet
        titleTemplate="%s - nostr web client"
        defaultTitle="Flycat nostr web client"
        htmlAttributes={{ lang: i18n.language }}
      >
        <meta name="description" content="A nostr web client" />
      </Helmet>

      <Switch>
        <Route path="/fof">
          <FriendOfFriend />
        </Route>

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
      {/* <GlobalStyle /> */}
    // </BrowserRouter> */}