import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Api } from 'service/api';
import { PhotoIcon } from './icon/Photo';

const styles = {
  postBox: {},
  postHintText: {
    color: '#acdae5',
    marginBottom: '5px',
  },
  postTextArea: {
    resize: 'none' as const,
    boxShadow: 'inset 0 0 1px #aaa',
    border: '1px solid #b9bcbe',
    width: '100%',
    height: '80px',
    fontSize: '14px',
    padding: '5px',
    overflow: 'auto',
  },
  btn: {
    textAlign: 'right' as const,
  },
  imgIconBtn: {
    border: 'none',
    color: 'lightsteelblue',
  },
};

const api = new Api();

interface Props {
  disabled: boolean;
  onSubmitText: (text: string) => Promise<any>;
}

export const PubNoteTextarea: React.FC<Props> = ({
  disabled,
  onSubmitText,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [attachImgs, setAttachImgs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectAndUploadImg = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    const file = event.target.files?.[0];

    if (!file) {
      setIsUploading(false);
      return;
    }

    const fileReader = new FileReader();

    fileReader.onloadend = () => {
      if (fileReader.result) {
        const blob = new Blob([fileReader.result], { type: file.type });
        handleImgUpload(blob, file.name, file.type);
      }
    };

    fileReader.readAsArrayBuffer(file);
  };

  const handleImgUpload = async (
    blob: Blob,
    fileName: string,
    imgType: string,
  ) => {
    const imageFile = new File([blob], fileName, { type: imgType });
    const formData = new FormData();
    formData.append('fileToUpload', imageFile);
    formData.append('submit', 'Upload Image');
    const url = await api.uploadImage(formData);

    // record url
    setAttachImgs(prev => {
      const newList = prev;
      if (!newList.includes(url)) {
        newList.push(url);
      }
      return newList;
    });
    setIsUploading(false);
  };

  const handleSubmitText = async (formEvt: React.FormEvent) => {
    formEvt.preventDefault();

    let textWithAttachImgs = text;
    for (const url of attachImgs) {
      textWithAttachImgs += ' ' + url;
    }

    await onSubmitText(textWithAttachImgs);

    // clear the textarea
    setText('');
    setAttachImgs([]);
  };

  return (
    <div style={styles.postBox}>
      <form onSubmit={handleSubmitText}>
        <div style={styles.postHintText}>{t('pubNoteBox.hintText')}</div>
        <textarea
          style={styles.postTextArea}
          value={text}
          onChange={event => setText(event.target.value)}
        ></textarea>
        <span>
          {attachImgs.map(url => (
            <span style={{ float: 'left' }}>
              <img
                src={url}
                style={{
                  width: '30px',
                  height: '30px',
                  border: '1px solid gray',
                  padding: '1px',
                }}
              />
              &nbsp;&nbsp;
            </span>
          ))}
        </span>
        <div style={styles.btn}>
          <button
            type="button"
            onClick={selectAndUploadImg}
            disabled={isUploading}
            style={styles.imgIconBtn}
          >
            <PhotoIcon />+{isUploading ? '↺' : ''}
          </button>
          &nbsp;&nbsp;
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button type="submit" disabled={disabled}>
            {t('pubNoteBox.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};
