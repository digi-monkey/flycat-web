// import react, react-markdown-editor-lite, and a markdown parser you like
import { Paths } from 'constants/path';
import { Editor } from '../Editor';
import { connect } from 'react-redux';
import { HashTags } from '../hashTags/HashTags';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SignEvent } from 'store/loginReducer';
import { useCallWorker } from 'hooks/useWorker';
import { ImageUploader } from 'components/layout/PubNoteTextarea';
import { loginMapStateToProps } from 'pages/helper';
import { Button, OutlinedInput } from '@mui/material';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Nip23, Nip23ArticleMetaTags, DirTags } from 'service/nip/23';

export function Write({
  isLoggedIn,
  signEvent,
}: {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}) {
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [dir, setDir] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [content, setContent] = useState<string>('');
  const { worker } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();

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
    router.push({ pathname: `${Paths.blog}/${myPublicKey}`});
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '30px',
      }}
    >
      <div style={{ margin: '10px 0px' }}>
        {image && <img src={image} alt="head image" />}
        {!image && (
          <div
            style={{
              width: '100%',
              height: '100px',
              border: '1px solid #aaa',
              padding: '20px 0',
              borderRadius: '5px',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'gray',
              display: 'flex'
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
          placeholder="title"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setSummary(event.target.value)}
          placeholder="summary"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setSlug(event.target.value)}
          placeholder="(optionally) slug, aka article_id, can not be changed after. just leave it blank if you don't understand it."
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px' }}>
        <OutlinedInput
          onChange={event => setDir(event.target.value)}
          placeholder="(optionally) virtual path of the article, split with '/', eg: dir1/dir2/dir3"
          fullWidth
        ></OutlinedInput>
      </div>
      <div style={{ margin: '10px 0px 20px 0px' }}>
        <HashTags callback={tags => setHashTags(tags.map(t => t.id))} />
      </div>

      <Editor onText={setContent} />
      <div style={{ margin: '10px 0px', textAlign: 'right' }}>
        <Button
          onClick={() => router.push({ pathname: `${Paths.blog}/${myPublicKey}`})}
          variant="contained"
          color="secondary"
        >
          <span style={{ color: 'black' }}>Cancel</span>
        </Button>{' '}
        <Button onClick={publish} variant="contained" color="primary">
          <span style={{ color: 'white' }}>Publish</span>
        </Button>
      </div>
    </div>
  );
}

export default connect(loginMapStateToProps)(Write);
