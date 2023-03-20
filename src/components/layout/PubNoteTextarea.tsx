import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Api } from 'service/api';
import {
  InsertPhoto,
  Send,
  TagFaces,
  AlternateEmail,
} from '@mui/icons-material';
import { LoginMode } from 'store/loginReducer';
import OfflineBoltOutlinedIcon from '@mui/icons-material/OfflineBoltOutlined';
import { compressImage } from 'service/helper';

const styles = {
  postBox: {
    boxShadow: 'inset 0 0 1px #aaa',
    border: '1px solid rgb(216 222 226)',
    padding: '5px',
    borderRadius: '5px',
  },
  postHintText: {
    color: '#acdae5',
    marginBottom: '5px',
  },
  postTextArea: {
    border: '1px white',
    resize: 'none' as const,
    width: '100%',
    height: '80px',
    fontSize: '14px',
    padding: '5px',
    overflow: 'auto',
  },
  btn: {
    textAlign: 'right' as const,
  },
  iconBtn: {
    border: 'none',
    color: 'lightsteelblue',
    background: 'white',
    padding: '0',
    fontSize: 'small',
  },
};

const api = new Api();

interface Props {
  disabled: boolean;
  mode: LoginMode;
  onSubmitText: (text: string) => Promise<any>;
}

export const PubNoteTextarea: React.FC<Props> = ({
  disabled,
  mode,
  onSubmitText,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isOnFocus, setIsOnFocus] = useState<boolean>(false);
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
    const file = new File([blob], fileName, { type: imgType });
    const imageFile = await compressImage(file);
    const formData = new FormData();
    formData.append('fileToUpload', imageFile, imageFile.name);
    formData.append('submit', 'Upload Image');
    const url = await api.uploadImage(formData);
    if (!url.startsWith('http')) {
      setIsUploading(false);
      return alert(url);
    }

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

  const isSendLightingInvoiceEnabled =
    mode === LoginMode.nip07Wallet && typeof window.webln !== undefined;
  const makeInvoice = async () => {
    if (typeof window?.webln === 'undefined') {
      return alert('No WebLN available.');
    }

    try {
      await window.webln.enable();
      const result = await window.webln.makeInvoice({});
      setText(prev => {
        if (result == null) return prev;
        const text = prev;
        return text + '\n\n' + result.paymentRequest;
      });
    } catch (error) {
      console.log(error);
      return alert('An error occurred during the makeInvoice() call.');
    }
  };

  return (
    <div
      onFocus={() => setIsOnFocus(true)}
      onBlur={() => setIsOnFocus(false)}
      style={{
        boxShadow: isOnFocus
          ? 'inset 0 0 1px lightgreen'
          : 'inset 0 0 1px #aaa',
        border: isOnFocus ? '1px solid #8DC53F' : '1px solid rgb(216 222 226)',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <form onSubmit={handleSubmitText}>
        <textarea
          placeholder={t('pubNoteBox.hintText') || ''}
          style={styles.postTextArea}
          value={text}
          onChange={event => setText(event.target.value)}
        ></textarea>
        <div>
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
        </div>
        <div style={styles.btn}>
          <span style={{ float: 'left' }}>
            <button
              type="button"
              onClick={selectAndUploadImg}
              disabled={isUploading}
              style={styles.iconBtn}
            >
              <InsertPhoto />+{isUploading ? '↺' : ''}
            </button>
            &nbsp;&nbsp;
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {isSendLightingInvoiceEnabled && (
              <button
                onClick={makeInvoice}
                type="button"
                disabled={!isSendLightingInvoiceEnabled}
                style={styles.iconBtn}
              >
                <OfflineBoltOutlinedIcon />
              </button>
            )}
            &nbsp;&nbsp;
            <button type="button" disabled={true} style={styles.iconBtn}>
              <TagFaces style={{ color: '#e2e2e2', cursor: 'default' }} />
            </button>
            &nbsp;&nbsp;
            <button type="button" disabled={true} style={styles.iconBtn}>
              <AlternateEmail style={{ color: '#e2e2e2', cursor: 'default' }} />
            </button>
          </span>
          <SubmitButton disabled={disabled} />
        </div>
      </form>
    </div>
  );
};

export const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <button
      style={{
        background: isHovered ? 'white' : '#8DC53F',
        color: isHovered ? 'black' : 'white',
        border: '1px solid #8DC53F',
        padding: '5px 10px',
        borderRadius: '5px',
      }}
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Send style={{ fontSize: 'medium' }} />
    </button>
  );
};

export const ImageUploader = ({
  onImgUrls,
}: {
  onImgUrls: (imgs: string[]) => any;
}) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [attachImgs, setAttachImgs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (attachImgs.length === 0) return;

    onImgUrls(attachImgs);
  }, [attachImgs.length]);

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

    if (!url.startsWith('https')) {
      // error
      return alert(url);
    }

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

  return (
    <span>
      <button
        type="button"
        onClick={selectAndUploadImg}
        disabled={isUploading}
        style={styles.iconBtn}
      >
        <InsertPhoto />+{isUploading ? '↺' : ''}
      </button>
      &nbsp;&nbsp;
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </span>
  );
};
