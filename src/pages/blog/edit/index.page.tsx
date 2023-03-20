// import react, react-markdown-editor-lite, and a markdown parser you like
import { Paths } from 'constants/path';
import { Editor } from '../Editor';
import { UserMap } from 'service/type';
import { connect } from 'react-redux';
import { SignEvent } from 'store/loginReducer';
import { CallRelayType } from 'service/worker/type';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { useCallWorker } from 'hooks/useWorker';
import router, { useRouter } from 'next/router';
import { loginMapStateToProps } from 'pages/helper';
import { Button, OutlinedInput } from '@mui/material';
import { HashTags, TagObj } from '../hashTags/HashTags';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import React, { useEffect, useState } from 'react';
import { Article, DirTags, Nip23, Nip23ArticleMetaTags } from 'service/nip/23';
import {
  Event,
  WellKnownEventKind,
  EventSetMetadataContent,
} from 'service/api';

export function Write({
  isLoggedIn,
  signEvent,
}: {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}) {
  const [article, setArticle] = useState<Article>();
  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const { articleId, publicKey } = useRouter().query;
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [dir, setDir] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [predefineHashTags, setPredefineHashTags] = useState<TagObj[]>([]);
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [content, setContent] = useState<string>('');
  const { worker, newConn } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.pubkey !== publicKey) {
      return;
    }

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

      const data = Nip23.toArticle(event);

      setArticle(article => {
        if (article?.updated_at && article?.updated_at >= data?.updated_at) {
          return article;
        }

        return data;
      });
    }
  }

  const publish = async () => {
    const dirTags: DirTags = ([Nip23ArticleMetaTags.dir] as any).concat(
      dir.split('/').filter(d => d.length > 0),
    );
    const rawEvent = Nip23.create({
      title,
      slug,
      image,
      summary,
      content,
      dirTags,
      hashTags,
    });
    console.log(rawEvent);
    if (signEvent == null) {
      return alert('sign method is null');
    }
    if (worker == null) {
      return alert('worker  is null');
    }

    const event = await signEvent(rawEvent);
    worker?.pubEvent(event);
    alert('published!');
    router.push({ pathname: `${Paths.post}/${myPublicKey}/${slug}`});
  };

  useEffect(() => {
    if (newConn.length === 0) return;

    const filter = Nip23.filter({
      authors: [publicKey as string],
      articleIds: [articleId as string],
    });
    worker
      ?.subFilter(filter, undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn,
      })
      ?.iterating({ cb: handleEvent });
  }, [newConn]);

  useEffect(() => {
    if (!article) return;

    setTitle(article.title || '');
    setSummary(article.summary || '');
    setContent(article.content);
    setImage(article.image || '');
    setSlug(article.id);

    if (article.dirs) {
      setDir(article.dirs.join('/'));
    }
    if (article.hashTags) {
      setHashTags(article.hashTags);

      setPredefineHashTags(
        article.hashTags.map(t => {
          return {
            id: t,
            text: t,
          };
        }),
      );
    }
  }, [article]);

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '30px',
      }}
    >
      <div style={{ margin: '10px 0px' }}>
        {image && (
          <div
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <img
              src={image}
              alt="head image"
              style={{ height: '150px', width: '100%' }}
            />
            {'Upload New Image'}{' '}
            <ImageUploader onImgUrls={url => setImage(url[0])} />
          </div>
        )}
        {!image && (
          <div
            style={{
              width: '100%',
              height: '100px',
              border: '1px solid whitesmoke',
              padding: '20px',
              borderRadius: '5px',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'gray',
            }}
          >
            {'Upload Cover Image'}{' '}
            <ImageUploader onImgUrls={url => setImage(url[0])} />
          </div>
        )}
      </div>

      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setTitle(event.target.value)}
          value={title}
          placeholder="title"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setSummary(event.target.value)}
          value={summary}
          placeholder="summary"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          placeholder="slug"
          value={slug}
          fullWidth
          disabled
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setDir(event.target.value)}
          value={dir}
          placeholder="dirs, split with /"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px 20px 0px' }}>
        <HashTags
          predefineTags={predefineHashTags}
          callback={tags => setHashTags(tags.map(t => t.id))}
        />
      </div>

      <Editor value={content} onText={setContent} />
      <div style={{ margin: '10px 0px', textAlign: 'right' }}>
        <Button
          onClick={() => router.push({ pathname: `${Paths.blog}/${myPublicKey}`})}
          variant="contained"
          color="secondary"
        >
          <span style={{ color: 'black' }}>Cancel</span>
        </Button>{' '}
        <Button onClick={publish} variant="contained" color="success">
          Publish
        </Button>
      </div>
    </div>
  );
}

export default connect(loginMapStateToProps)(Write);
