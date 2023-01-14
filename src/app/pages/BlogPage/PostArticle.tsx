import React, { useState } from 'react';

interface Props {
  onSubmit?: (FormData) => any;
}

export interface ArticlePostForm {
  title: string;
  content: string;
}

const PostArticle: React.FC<Props> = ({ onSubmit }) => {
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
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        id="title"
        name="title"
        placeholder="标题"
        value={formData.title}
        onChange={handleChange}
        style={{ width: '100%' }}
      />
      <br />
      <textarea
        id="content"
        name="content"
        placeholder="正文.."
        value={formData.content}
        onChange={handleChange}
        style={{ width: '100%', minHeight: '200px' }}
      />
      <br />
      <button type="submit">发布</button>
    </form>
  );
};

export default PostArticle;
