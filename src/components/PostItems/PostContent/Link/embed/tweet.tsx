import { useRef } from 'react';
import Script from 'next/script';

export const TweetEmbed = ({ link }: { link: string }) => {
  const id = getTweetId(link) as string;
  const tweetRef = useRef<HTMLDivElement>(null);

  const createTweet = () => {
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (window.twttr && tweetRef.current) {
      window.twttr.widgets
        .createTweet(
          id,
          tweetRef.current,
          isDarkTheme.matches && { theme: 'dark' },
        )
        .then(() => {
          const len = tweetRef.current?.childNodes.length;
          if (len && len > 1) {
            for (let i = 1; i < len; i++) {
              tweetRef.current.removeChild(tweetRef.current.childNodes[i]);
            }
          }
        });
    }
  };

  return (
    <>
      <div ref={tweetRef} className="tweet" style={{ width: '100%' }}></div>
      <Script
        async
        src="https://platform.twitter.com/widgets.js"
        onLoad={() => {
          /* Code to run after the script is loaded */
          createTweet();
        }}
      />
    </>
  );
};

export function getTweetId(url) {
  const parse = new URL(url);

  if (parse.host == 'twitter.com') {
    const paths = parse.pathname.split('/');
    if (paths[2] == 'status') return paths[3];
  }

  return false;
}
