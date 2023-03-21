import { Paths } from 'constants/path';
import { ThinHr } from 'components/layout/ThinHr';
import { UserMap } from 'service/type';
import { RootState } from 'store/configureStore';
import { useRouter } from 'next/router';
import { formatDate } from 'service/helper';
import { CallWorker } from 'service/worker/callWorker';
import { LikedButton } from '../LikedButton';
import { useSelector } from 'react-redux';
import { useTimeSince } from 'hooks/useTimeSince';
import { CallRelayType } from 'service/worker/type';
import { ProfileAvatar } from 'components/layout/msg/TextMsg';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { Grid, useTheme } from '@mui/material';
import { Article, Nip23 } from 'service/nip/23';
import { payLnUrlInWebLn } from 'service/lighting/lighting';
import { getDateBookName } from 'hooks/useDateBookData';
import { Nip08, RenderFlag } from 'service/nip/08';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BaseLayout, Left, Right } from 'components/layout/BaseLayout';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Event,
  EventSetMetadataContent,
  WellKnownEventKind,
} from 'service/api';

import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import ReactMarkdown from 'react-markdown';
import ElectricBoltOutlinedIcon from '@mui/icons-material/ElectricBoltOutlined';

type UserParams = {
  publicKey: string;
  articleId: string;
}

export default function NewArticle() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { publicKey, articleId } = useRouter().query as UserParams;

  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const myPublicKey = useReadonlyMyPublicKey();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [article, setArticle] = useState<Article>();
  const [articleEvent, setArticleEvent] = useState<Event>();
  const [comments, setComments] = useState<Event[]>([]);
  const [inputComment, setInputComment] = useState('');

  const handleCommentSubmit = async () => {
    if (signEvent == null) {
      return alert('sign method not found');
    }
    if (article == null) {
      return alert('article is not loaded');
    }
    if (worker == null) {
      return alert('worker is null');
    }

    const rawEvent = Nip23.commentToArticle(inputComment, article);
    const event = await signEvent(rawEvent);
    console.log(event);
    worker?.pubEvent(event);

    setInputComment('');
    alert('published! please refresh the page, sorry will fix this soon!');
  };

  const { worker, newConn } = useCallWorker();

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.kind === WellKnownEventKind.set_metadata) {
      const metadata: EventSetMetadataContent = JSON.parse(event.content);
      setUserMap(prev => {
        const newMap = new Map(prev);
        const oldData = newMap.get(event.pubkey);
        if (oldData && oldData.created_at > event.created_at) {
          // the new data is outdated
          return newMap;
        }

        newMap.set(event.pubkey, {
          ...metadata,
          ...{ created_at: event.created_at },
        });
        return newMap;
      });
      return;
    }

    if (event.kind === WellKnownEventKind.long_form) {
      if (event.pubkey !== publicKey) return;
      const article = Nip23.toArticle(event);
      setArticle(prevArticle => {
        if (!prevArticle || article?.updated_at >= prevArticle.updated_at) {
          return article;
        }
        return prevArticle;
      });
      setArticleEvent(prev => {
        if (!prev || prev?.created_at < event.created_at) {
          return event;
        }
        return prev;
      });
      return;
    }

    if (event.kind === WellKnownEventKind.text_note) {
      // if (article == null) return;
      // if (!Nip23.isCommentEvent(event, article)) return;

      setComments(prev => {
        if (!prev.map(p => p.id).includes(event.id)) {
          return [...prev, event].sort((a, b) =>
            a.created_at >= b.created_at ? 1 : -1,
          );
        }
        return prev;
      });
      return;
    }
  }

  useEffect(() => {
    if (newConn.length === 0) return;

    const callRelay = {
      type: CallRelayType.batch,
      data: newConn,
    };

    worker
      ?.subMetadata([publicKey as string], undefined, undefined, callRelay)
      ?.iterating({ cb: handleEvent });
    const filter = Nip23.filter({
      authors: [publicKey as string],
      articleIds: [articleId as string],
    });
    worker
      ?.subFilter(filter, undefined, 'article-data', callRelay)
      ?.iterating({ cb: handleEvent });
  }, [newConn, publicKey]);

  useEffect(() => {
    if (article == null) return;

    worker
      ?.subFilter(Nip23.toPullCommentFilter(article), undefined, 'article-data')
      ?.iterating({ cb: handleEvent });
  }, [article]);

  const content = useMemo(() => {
    if (articleEvent == null) return;

    let event = articleEvent;
    event.content = Nip08.replaceMentionPublickey(
      event,
      userMap,
      RenderFlag.Markdown,
    );
    event.content = Nip08.replaceMentionEventId(event, RenderFlag.Markdown);
    return event.content;
  }, [articleEvent, userMap]);

  return (
    <BaseLayout silent={true}>
      <Left>
        <div
          style={{
            overflow: 'auto',
            padding: '0px',
            border: '0px',
          }}
        >
          <div
            style={{
              //padding: '20px',
              margin: '0px 0 0 0',
              background: 'white',
            }}
          >
            <div>
              {article?.image && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img
                    src={article.image}
                    style={{ height: '250px', width: '100%' }}
                  />
                </div>
              )}
              <div style={{ margin: '10px 0px 40px 0px' }}>
                <div
                  style={{
                    fontSize: '25px',
                    margin: '20px 0px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                  }}
                >
                  {article?.title}
                </div>
                <div
                  style={{
                    color: 'gray',
                    fontSize: '14px',
                    margin: '5px 0px 10px 0px',
                  }}
                >
                  <Link href={Paths.user + publicKey}>
                    <span style={{ marginRight: '5px' }}>
                      {userMap.get(publicKey)?.name}
                    </span>
                  </Link>
                  {article?.published_at && (
                    <span style={{ margin: '0px 10px' }}>
                      {formatDate(article?.published_at)}
                    </span>
                  )}

                  {publicKey === myPublicKey && (
                    <Link
                      href={`${Paths.edit + publicKey}/${articleId}`}
                      style={{ color: 'gray' }}
                    >
                      {' '}
                      ~ <EditIcon style={{ height: '14px', color: 'gray' }} />
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <div style={{ margin: '10px 0px 30px 0px', fontSize: '14px' }}>
                  {article?.hashTags?.flat(Infinity).map(t => (
                    <span
                      style={{
                        background: theme.palette.secondary.main,
                        margin: '5px',
                        padding: '5px',
                        borderRadius: '5px',
                        color: 'gray',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <ReactMarkdown
                // className="heti heti--classic"
                components={{
                  h1: ({ node, ...props }) => (
                    <div
                      style={{ fontSize: '20px', fontWeight: 'bold' }}
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <div
                      style={{ fontSize: '18px', fontWeight: 'bold' }}
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <div
                      style={{ fontSize: '16px', fontWeight: 'bold' }}
                      {...props}
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <div
                      style={{ fontSize: '14px', fontWeight: 'bold' }}
                      {...props}
                    />
                  ),
                  img: ({ node, ...props }) => (
                    <img style={{ width: '100%' }} {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      style={{
                        borderLeft: `5px solid ${theme.palette.primary.main}`,
                        padding: '0.5rem',
                        margin: '0 0 1rem',
                        fontStyle: 'italic',
                      }}
                      {...props}
                    />
                  ),
                  code: ({ node, inline, ...props }) => {
                    return inline ? (
                      <span
                        style={{
                          background: theme.palette.secondary.main,
                          padding: '5px',
                        }}
                        {...props}
                      />
                    ) : (
                      <div
                        style={{
                          background: theme.palette.secondary.main,
                          padding: '20px',
                          borderRadius: '5px',
                        }}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {content ?? ''}
              </ReactMarkdown>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                margin: '80px 0px 20px 0px',
                width: '100%',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <div style={{ width: '80px', margin: '0 auto' }}>
                  <Link href={Paths.user + publicKey}>
                    <img
                      src={userMap.get(publicKey)?.picture}
                      alt=""
                      style={{
                        width: '80px',
                        height: '80px',
                        display: 'block',
                        borderRadius: '50%',
                      }}
                    />
                  </Link>
                </div>
                <div style={{ margin: '10px 0px 20px 0px' }}>
                  <Link
                    style={{ fontSize: '16px', color: 'black' }}
                    href={Paths.user + publicKey}
                  >
                    {userMap.get(publicKey)?.name}
                  </Link>
                </div>
                <div>
                  <LikedButton
                    onClick={async () => {
                      const lnUrl =
                        userMap.get(publicKey)?.lud06 ||
                        userMap.get(publicKey)?.lud16;
                      if (lnUrl == null) {
                        return alert(
                          'no ln url, please tell the author to set up one.',
                        );
                      }
                      await payLnUrlInWebLn(lnUrl);
                    }}
                  >
                    <ElectricBoltOutlinedIcon />
                    <span style={{ marginLeft: '5px' }}>
                      {'like the author'}
                    </span>
                  </LikedButton>
                </div>

                <div
                  style={{
                    background: theme.palette.secondary.main,
                    margin: '60px 0px 20px 0px',
                    borderRadius: '5px',
                    padding: '10px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ textTransform: 'capitalize', color: 'gray' }}>
                    {'collected in'}
                  </span>
                  <span
                    style={{
                      background: theme.palette.secondary.main,
                      margin: '5px',
                      padding: '5px',
                      borderRadius: '5px',
                      textDecoration: 'underline',
                    }}
                  >
                    {getDateBookName(
                      article?.published_at || article?.updated_at || 0,
                    )}
                  </span>
                  {article?.dirs?.map(t => (
                    <span
                      style={{
                        background: theme.palette.secondary.main,
                        margin: '5px',
                        padding: '5px',
                        borderRadius: '5px',
                        textDecoration: 'underline',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <span
                style={{
                  margin: '0px 5px',
                  fontSize: '14px',
                  color: 'gray',
                  textTransform: 'capitalize',
                }}
              >
                {t('articleRead.lastUpdatedAt') + ' '}
                {useTimeSince(article?.updated_at ?? 10000)}
              </span>
            </div>
          </div>
          <div
            style={{
              width: '100%',
              minHeight: '100px',
              height: '100%',
              background: theme.palette.secondary.main,
              padding: '20px',
            }}
          >
            <div>
              <textarea
                style={{ width: '100%', height: '68px', padding: '5px' }}
                value={inputComment}
                onChange={e => setInputComment(e.target.value)}
              />
              <button type="button" onClick={handleCommentSubmit}>
                {t('articleRead.submit')}
              </button>
            </div>

            <ThinHr></ThinHr>

            <div style={{ marginTop: '40px' }}>
              <Comment comments={comments} worker={worker} userMap={userMap} />
            </div>
          </div>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
      ...(await serverSideTranslations(locale, ['common']))
  }
})

export const getStaticPaths = () => ({ paths: [], fallback: true });

export interface CommentProps {
  comments: Event[];
  userMap: UserMap;
  worker?: CallWorker;
}

export function Comment({ comments, userMap, worker }: CommentProps) {
  const commentsRef = useRef<Event[]>([]);
  useEffect(() => {
    const prevComments = commentsRef.current;
    const newComments = comments.filter(
      comment => !prevComments.map(p => p.id).includes(comment.id),
    );
    console.log('New comment added:', newComments.length);
    commentsRef.current = comments;

    const pks = newComments.map(a => a.pubkey);
    if (pks.length === 0) return;
    worker?.subMetadata(pks, undefined, 'article-data');
  }, [comments]);

  return (
    <div>
      {comments.map(comment => (
        <li
          key={comment.id}
          style={{
            margin: '10px 0px',
            borderBottom: '1px dotted gray',
            listStyleType: 'none',
          }}
        >
          <Grid container>
            <Grid
              item
              xs={2}
              style={{ textAlign: 'right', paddingRight: '20px' }}
            >
              <ProfileAvatar
                picture={userMap.get(comment.pubkey)?.picture}
                name={comment.pubkey}
              />
            </Grid>
            <Grid item xs={10}>
              <span>
                <Link
                  style={{ fontSize: '14px' }}
                  href={Paths.user + comment.pubkey}
                >
                  @{userMap.get(comment.pubkey)?.name || '__'}
                </Link>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'gray',
                    marginLeft: '10px',
                  }}
                >
                  {new Date(comment.created_at).toLocaleTimeString()}
                </span>

                <span
                  style={{
                    display: 'block',
                    padding: '10px 0px',
                  }}
                >
                  {comment.content}
                </span>
              </span>
            </Grid>
          </Grid>
        </li>
      ))}
    </div>
  );
}
