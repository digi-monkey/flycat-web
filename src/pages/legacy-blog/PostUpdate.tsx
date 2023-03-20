import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Modal from 'react-modal';

interface PostUpdateProps {
  isOpen: boolean;
  onSubmit?: (title: string, content: string) => void;
  onCancel: () => void;
  title: string;
  content: string;
}

const PostUpdate: React.FC<PostUpdateProps> = ({
  isOpen,
  onSubmit,
  onCancel,
  title,
  content,
}) => {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState(title);
  const [newContent, setNewContent] = useState(content);

  return (
    <Modal
      isOpen={isOpen}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '620px',
          overflow: 'auto',
          padding: '0px',
          border: '0px',
          WebkitOverflowScrolling: 'touch',
        },
      }}
    >
      <div style={{ padding: '20px' }}>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (onSubmit) {
              onSubmit(newTitle, newContent);
            }
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Enter title"
            style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Enter content"
            style={{
              padding: '5px',
              width: '100%',
              height: '500px',
              marginBottom: '10px',
            }}
          />
          <button type="submit">{t('postUpdate.submit')}</button>
          &nbsp;
          <button type="button" onClick={onCancel}>
            {t('postUpdate.cancel')}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default PostUpdate;
