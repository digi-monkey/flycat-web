import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  onSubmit?: (FormData) => any;
}

export interface ArticlePostForm {
  title: string;
  content: string;
}

const PostArticle: React.FC<Props> = ({ onSubmit }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ArticlePostForm>({
    title: '',
    content: '',
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Do something with the form data, such as send it to an API
    console.log(formData);
    if (onSubmit) {
      onSubmit(formData);
    }
    setFormData({
      title: '',
      content: '',
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <span style={{ margin: '20px 0px', background: 'gray' }}>
      <span style={{ display: 'block', fontSize: '16px' }}>
        {t('postArticle.newArticle')}
      </span>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="title"
          name="title"
          placeholder={t('postArticle.titlePlaceHolder') || ''}
          value={formData.title}
          onChange={handleChange}
          style={{ width: '100%' }}
        />
        <br />
        <textarea
          id="content"
          name="content"
          placeholder={t('postArticle.contentPlaceHolder') || ''}
          value={formData.content}
          onChange={handleChange}
          style={{ width: '100%', minHeight: '200px' }}
        />
        <br />
        <button type="submit">{t('postArticle.submit')}</button>
      </form>
    </span>
  );
};

export default PostArticle;
