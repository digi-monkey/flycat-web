const NostrNestsEmbed = ({ link }: { link: string }) => (
  <iframe
    src={link}
    allow="microphone"
    width="480"
    height="680"
    style={{ maxHeight: 680 }}
    onClick={e => e.stopPropagation()}
  ></iframe>
);

export default NostrNestsEmbed;
