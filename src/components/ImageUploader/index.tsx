import { ImageProvider } from 'core/api/img';
import { FileImageOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from "react";

import styles from './index.module.scss';

const api = new ImageProvider();

export const ImageUploader = ({
  onImgUrls,
}: {
  onImgUrls: (imgs: string[]) => any;
}) => {
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

  return (
    <div className={styles.imgUploader}>
      <button
        type="button"
        onClick={selectAndUploadImg}
        disabled={isUploading}
        className={styles.iconBtn}
      >
        <FileImageOutlined />+{isUploading ? '↺' : ''}
      </button>
      &nbsp;&nbsp;
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
};
