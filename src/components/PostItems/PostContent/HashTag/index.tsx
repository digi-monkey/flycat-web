import Link from 'next/link';

export const Hashtag = ({ tag }: { tag: string }) => {
  return (
    <span className="hashtag">
      <Link href={`/hashtags/${tag}`} onClick={e => e.stopPropagation()}>
        #{tag}
      </Link>
    </span>
  );
};
