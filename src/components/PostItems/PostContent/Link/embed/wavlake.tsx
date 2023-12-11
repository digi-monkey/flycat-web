export const WavlakeEmbed = ({ link }: { link: string }) => {
  const convertedUrl = link.replace(/(?:player\.|www\.)?wavlake\.com/, "embed.wavlake.com");

  return (
    <iframe
      onClick={(e)=>e.stopPropagation()}
      style={{ borderRadius: 12 }}
      src={convertedUrl}
      width="100%"
      height="380"
      frameBorder="0"
      loading="lazy"></iframe>
  );
};
