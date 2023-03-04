// import react, react-markdown-editor-lite, and a markdown parser you like
import React, { useState } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';
import { Button, OutlinedInput } from '@mui/material';
import { useCallWorker } from 'hooks/useWorker';
import { Nip23, Nip23ArticleMetaTags, DirTags } from 'service/nip/23';
import { loginMapStateToProps } from 'app/helper';
import { connect } from 'react-redux';
import { SignEvent } from 'store/loginReducer';
import { ImageUploader } from '../../components/layout/PubNoteTextarea';
import { HashTags } from './hashTags/HashTags';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

// Register plugins if required
// MdEditor.use(YOUR_PLUGINS_HERE);

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);

export function Editor({ onText }: { onText: (text: string) => any }) {
  function handleEditorChange({ html, text }) {
    onText(text);
  }
  return (
    <MdEditor
      style={{ minHeight: '700px', height: '100%' }}
      renderHTML={text => mdParser.render(text)}
      onChange={handleEditorChange}
      view={{ menu: true, md: true, html: false }}
    />
  );
}

export function Write({
  isLoggedIn,
  signEvent,
}: {
  isLoggedIn: boolean;
  signEvent?: SignEvent;
}) {
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [dir, setDir] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [content, setContent] = useState<string>('');
  const { worker } = useCallWorker({
    onMsgHandler: () => {},
    updateWorkerMsgListenerDeps: [],
  });
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
    window.location.href = '/blog/' + myPublicKey;
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
          onClick={() => {
            window.location.href = '/blog/' + myPublicKey;
          }}
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
