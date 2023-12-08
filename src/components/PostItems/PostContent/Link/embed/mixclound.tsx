import { MixCloudRegex } from '../regex';

export const MixCloudEmbed = ({ link }: { link: string }) => {
  const feedPath =
    (MixCloudRegex.test(link) && RegExp.$1) +
    '%2F' +
    (MixCloudRegex.test(link) && RegExp.$2);

  const lightParams = 'light=1';
  return (
    <>
      <br />
      <iframe
        title="SoundCloud player"
        width="100%"
        height="120"
        frameBorder="0"
        src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&${lightParams}&feed=%2F${feedPath}%2F`}
      />
    </>
  );
};
