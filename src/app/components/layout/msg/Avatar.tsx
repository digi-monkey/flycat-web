import React, { useState, useEffect } from 'react';

export const Avatar = ({
  picture,
  name,
  style,
}: {
  picture?: string;
  name?: string;
  style?: React.CSSProperties;
}) => {
  const theme = 'marble';
  const defaultUrl = `https://source.boringavatars.com/${theme}/60/${
    name || Date.now().toString()
  }?color=65A766,F1CF4D,148F8D`;
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (picture != null) {
      setUrl(picture);
    }
  }, [picture]);

  const handleError = () => {
    setUrl(defaultUrl);
  };

  return (
    <img
      style={{
        ...{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          maxWidth: '100%',
        },
        ...style,
      }}
      src={url || defaultUrl}
      alt=""
      onError={handleError}
    />
  );
};
