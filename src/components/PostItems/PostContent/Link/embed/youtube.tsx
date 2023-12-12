export const YoutubeEmbed: React.FC<{ youtubeId: string }> = ({
  youtubeId,
}) => {
  return (
    <iframe
      onClick={(e)=>e.stopPropagation()}
      className="w-max"
      src={`https://www.youtube.com/embed/${youtubeId}`}
      title="YouTube video player"
      key={youtubeId}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen={true}
    />
  );
};
