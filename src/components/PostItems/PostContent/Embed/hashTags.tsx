export function textWithHashtags(text: string) {
  const hashtagRegex = /(#\S+)/g;
  const parts = text.split(hashtagRegex);

  const jsxElements = parts.map((part, index) => {
    if (part.match(hashtagRegex)) {
      const hashtag = part.substring(1); // Remove the '#' character
      return (
        <a
          key={index}
          href={`/hashtags/${hashtag}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          #{hashtag}
        </a>
      );
    } else {
      return <span key={index}>{part}</span>;
    }
  });

  return <>{jsxElements}</>;
}
