import MarkdownIt from 'markdown-it';
import ReactMdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

import { ImageProvider, compressImage } from 'core/api/img';

// Initialize a markdown parser
const mdParser = new MarkdownIt();
const api = new ImageProvider();

export function MdEditor(Props) {

  async function onImageUpload(file) {
    const imageFile = await compressImage(file);
    const formData = new FormData();
    formData.append('fileToUpload', imageFile, imageFile.name);
    formData.append('submit', 'Upload Image');
    const url = await api.uploadImage(formData);
    if (!url.startsWith('http')) {
      return alert(url);
    } else {
      return url;
    }
  }

  return (
    <ReactMdEditor
      renderHTML={text => mdParser.render(text)}
      onChange={({ html, text }) => Props.onText(text)}
      onImageUpload={onImageUpload}
      view={{ menu: true, md: true, html: false }}
      {...Props}
    />
  );
}
