export const TwitchEmbed = ({ link }: { link: string }) => {
  const channel = link.split('/').slice(-1);

  const args = `?channel=${channel}&parent=${window.location.hostname}&muted=true`;
  return (
    <iframe
      onClick={(e)=>e.stopPropagation()}
      src={`https://player.twitch.tv/${args}`}
      className="w-max"
      allowFullScreen={true}
    ></iframe>
  );
};
