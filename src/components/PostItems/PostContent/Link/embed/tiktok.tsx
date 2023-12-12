export const TikTok = ({ link }: { link: string }) => {
  const vid = link.split('video/')[1];
  return (
    <iframe
      onClick={(e)=>e.stopPropagation()}
      style={{
        aspectRatio: '9 / 13',
        maxWidth: 660,
        overflow: 'hidden',
        background: 'transparent',
        width: '100%',
      }}
      src={`https://www.tiktok.com/embed/v2/${vid}?embedFrom=oembed&autoplay=false`}
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"
    ></iframe>
  );
};
