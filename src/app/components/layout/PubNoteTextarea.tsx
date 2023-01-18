import React, { useState } from 'react';

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
    display: 'box',
    textAlign: 'right' as const,
  },
};

interface Props {
  onSubmitText: (text: string) => Promise<any>;
}

export const PubNoteTextarea: React.FC<Props> = ({ onSubmitText }) => {
  const [text, setText] = useState('');

  const handleSubmitText = async (formEvt: React.FormEvent) => {
    formEvt.preventDefault();

    await onSubmitText(text);

    // clear the textarea
    setText('');
  };

  return (
    <div style={styles.postBox}>
      <form onSubmit={handleSubmitText}>
        <div style={styles.postHintText}>你在想什么？</div>
        <textarea
          style={styles.postTextArea}
          value={text}
          onChange={event => setText(event.target.value)}
        ></textarea>
        <div style={styles.btn}>
          <button type="submit">发送</button>
        </div>
      </form>
    </div>
  );
};
