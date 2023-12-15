export const SoundCloudEmbed = ({ link }: { link: string }) => {
  return (
    <iframe
      onClick={e => e.stopPropagation()}
      width="100%"
      height="166"
      scrolling="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${link}`}
    ></iframe>
  );
};
