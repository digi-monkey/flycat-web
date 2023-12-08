import {
  YoutubeUrlRegex,
  TidalRegex,
  SoundCloudRegex,
  MixCloudRegex,
  SpotifyRegex,
  TwitchRegex,
  AppleMusicRegex,
  WavlakeRegex,
} from './regex';

import { AppleMusicEmbed } from './embed/apple';
import { MixCloudEmbed } from './embed/mixclound';
import { SoundCloudEmbed } from './embed/soundcloud';
import { SpotifyEmbed } from './embed/spotify';
import { TidalEmbed } from './embed/tidal';
import { TwitchEmbed } from './embed/twitch';
import { WavlakeEmbed } from './embed/wavlake';
import { YoutubeEmbed } from './embed/youtube';
import { URLPreview } from './embed/preview';
import { getTweetId } from './util';

import dynamic from 'next/dynamic';

const TweetEmbed = dynamic(
  async () => {
    const mod = await import('./embed/tweet');
    return mod.TweetEmbed;
  },
  { loading: () => <p>Loading tweet...</p>, ssr: false, suspense: true },
);

export interface HyperLink {
  url: string;
}

export const HyperLink: React.FC<HyperLink> = ({ url }) => {
  const a = url;
  try {
    const youtubeId = YoutubeUrlRegex.test(a) && RegExp.$1;
    const tidalId = TidalRegex.test(a) && RegExp.$1;
    const soundCloudId = SoundCloudRegex.test(a) && RegExp.$1;
    const mixCloudId = MixCloudRegex.test(a) && RegExp.$1;
    const isSpotifyLink = SpotifyRegex.test(a);
    const isTwitchLink = TwitchRegex.test(a);
    const isAppleMusicLink = AppleMusicRegex.test(a);
    const isWavlakeLink = WavlakeRegex.test(a);
    const isTweetLink = !!getTweetId(a);

    if (youtubeId) {
      return <YoutubeEmbed youtubeId={youtubeId} />;
    } else if (isTweetLink) {
      return <TweetEmbed link={a} />;
    } else if (tidalId) {
      return <TidalEmbed link={a} />;
    } else if (soundCloudId) {
      return <SoundCloudEmbed link={a} />;
    } else if (mixCloudId) {
      return <MixCloudEmbed link={a} />;
    } else if (isSpotifyLink) {
      return <SpotifyEmbed link={a} />;
    } else if (isTwitchLink) {
      return <TwitchEmbed link={a} />;
    } else if (isAppleMusicLink) {
      return <AppleMusicEmbed link={a} />;
    } else if (isWavlakeLink) {
      return <WavlakeEmbed link={a} />;
    } else {
      return <URLPreview url={a} />;
    }
  } catch {
    // Ignore the error.
  }
  return (
    <a
      href={a}
      onClick={e => e.stopPropagation()}
      target="_blank"
      rel="noreferrer"
      className="ext"
    >
      {a}
    </a>
  );
};
