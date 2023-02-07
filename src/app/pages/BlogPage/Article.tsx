import ReactModal from 'react-modal';
import React, { useState } from 'react';
import {
  ArticleDataSchema,
  SiteMetaDataContentSchema,
} from 'service/flycat-protocol';
import { useTimeSince } from 'hooks/useTimeSince';
import { EventSetMetadataContent, PublicKey } from 'service/api';
import ReactMarkdown from 'react-markdown';
import PostUpdate from './PostUpdate';
import { useTranslation } from 'react-i18next';

export interface ArticleProps {
  article: ArticleDataSchema & { page_id: number };
  siteMetaData: SiteMetaDataContentSchema;
  publicKey: PublicKey;
  isOwner: boolean;
  author?: EventSetMetadataContent;
  onCommentSubmit?: (comments: string) => any;
  onUpdateSubmit?: (article: ArticleDataSchema & { page_id: number }) => any;
  onRefreshArticlePage?: () => any;
}

export function Article(props: ArticleProps) {
  const {
    onCommentSubmit,
    siteMetaData,
    publicKey,
    author,
    article,
    onUpdateSubmit,
    isOwner,
    onRefreshArticlePage,
  } = props;

  const { t } = useTranslation();
  const [readModalIsOpen, setReadModalIsOpen] = useState(false);

  const [updateModalIsOpen, seUpdateModalIsOpen] = useState(false);

  const [comments, setComments] = useState('');

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onCommentSubmit) {
      onCommentSubmit(comments);
    }
    alert('not supported还没做');
  };

  const onClickArticle = () => {
    if (isOwner) {
      return openModal();
    } else {
      return window.open('/article/' + publicKey + '/' + article.id, '_blank');
    }
  };

  const openModal = () => {
    setReadModalIsOpen(true);
  };

  const closeModal = () => {
    setReadModalIsOpen(false);
  };

  const onUpdateSubmitCb = (title: string, content: string) => {
    if (onUpdateSubmit) {
      const newArticle: ArticleDataSchema & { page_id: number } = {
        ...article,
        ...{
          content_size: content.length,
          content,
          title,
          updated_at: Math.round(Date.now() / 1000),
        },
      };

      onUpdateSubmit(newArticle);

      seUpdateModalIsOpen(false);

      if (onRefreshArticlePage) {
        onRefreshArticlePage();
      }
    }
  };

  return (
    <div>
      <a
        href={'/article/' + publicKey + '/' + article.id}
        target="_blank"
        rel="noreferrer"
        //onClick={onClickArticle}
      >
        {article.title}
      </a>

      {isOwner && (
        <span style={{ float: 'right' as const }}>
          <a href="#" onClick={() => seUpdateModalIsOpen(true)}>
            {t('blog.edit')}
          </a>
          &nbsp;
        </span>
      )}

      <PostUpdate
        isOpen={updateModalIsOpen}
        onSubmit={onUpdateSubmitCb}
        onCancel={() => seUpdateModalIsOpen(false)}
        title={article.title}
        content={article.content}
      />
      <ReactModal
        isOpen={readModalIsOpen}
        onRequestClose={closeModal}
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
            width: '850px',
            height: '100%',
            overflow: 'auto',
            padding: '0px',
            border: '0px',
            WebkitOverflowScrolling: 'touch',
          },
        }}
        contentLabel="Article"
      >
        <div
          style={{
            width: '100%',
            height: '68px',
            background: '#F7F5EB',
            padding: '20px',
          }}
        >
          <span style={{ marginTop: '35px' }}>
            <span style={{ float: 'right', padding: '0px 5px' }}>
              {t('blog.rePostShare')}
            </span>
            <span style={{ float: 'right', padding: '0px 5px' }}>🔗</span>
          </span>
        </div>
        <div style={{ padding: '40px', margin: '50px 0 0 0' }}>
          <span className="article heti heti--classic">
            <h1 className="article__title">{article.title}</h1>
            <span
              style={{
                color: 'gray',
                fontSize: '12px',
                marginTop: '5px',
              }}
            >
              <a href={'/user/' + publicKey}>
                <span style={{ marginRight: '5px' }}>{author?.name}</span>
              </a>
              {t('blog.postOn') + ' '}
              {useTimeSince(article.created_at)}
            </span>
            <hr />
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img style={{ width: '100%' }} {...props} />
                ),
              }}
              className="heti heti--classic"
            >
              {article.content}
            </ReactMarkdown>
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '80px 20px',
            }}
          >
            <div style={{ textAlign: '-webkit-center' as any }}>
              <img
                src={author?.picture}
                alt=""
                style={{ width: '80px', height: '80px', display: 'block' }}
              />
              <h3>{siteMetaData?.site_name}</h3>
              <span style={{ fontSize: '14px', color: 'gray' }}>
                {siteMetaData?.site_description}
              </span>
              <br />
              <br />
              <span>
                <a href={'/user/' + publicKey}>{author?.name}</a>
              </span>
            </div>
          </div>
          <div style={{ marginTop: '80px', marginBottom: '20px' }}>
            <span
              style={{ margin: '0px 5px', fontSize: '14px', color: 'gray' }}
            >
              {t('blog.lastUpdatedAt') + ' '}
              {useTimeSince(article.updated_at)}
            </span>
            <span
              style={{
                margin: '0px 5px',
                fontSize: '14px',
                color: 'gray',
                float: 'right',
              }}
            ></span>
            <span
              style={{
                margin: '0px 5px',
                fontSize: '14px',
                color: 'gray',
                float: 'right',
              }}
            >
              <span>{t('blog.rePostShare')}</span>
            </span>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            minHeight: '100px',
            height: '100%',
            background: '#ECECEC',
            padding: '20px',
          }}
        >
          <form onSubmit={handleCommentSubmit}>
            <textarea
              style={{ width: '100%', height: '68px', padding: '5px' }}
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
            <button type="submit">{t('blog.submit')}</button>
          </form>
        </div>
      </ReactModal>
    </div>
  );
}
