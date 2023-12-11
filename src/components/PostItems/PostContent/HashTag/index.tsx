import Link from 'next/link';

export const Hashtag = ({ tag }: { tag: string }) => {
  return (
    <span className="hashtag" onClick={e => e.stopPropagation()}>
      <Link href={`/hashtags/${tag}`} onClick={e => e.stopPropagation()}>
        #{tag}
      </Link>
    </span>
  );
};
