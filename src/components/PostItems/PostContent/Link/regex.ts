export const YoutubeUrlRegex =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:live\/|shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/;

export const TikTokUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/(?:[^\/]+\/){3}video\/\d+\/?)/i;

/**
 * Tidal share link regex
 */
export const TidalRegex = /tidal\.com\/(?:browse\/)?(\w+)\/([a-z0-9-]+)/i;

/**
 * SoundCloud regex
 */
export const SoundCloudRegex =
  /soundcloud\.com\/(?!live)([a-zA-Z0-9]+)\/([a-zA-Z0-9-]+)/;

/**
 * Mixcloud regex
 */
export const MixCloudRegex =
  /mixcloud\.com\/(?!live)([a-zA-Z0-9]+)\/([a-zA-Z0-9-]+)/;

/**
 * Spotify embed regex
 */
export const SpotifyRegex =
  /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/;

/**
 * Twitch embed regex
 */
export const TwitchRegex = /twitch.tv\/([a-z0-9_]+$)/i;

/**
 * Apple Music embed regex
 */
export const AppleMusicRegex =
  /music\.apple\.com\/([a-z]{2}\/)?(?:album|playlist)\/[\w\d-]+\/([.a-zA-Z0-9-]+)(?:\?i=\d+)?/i;

/**
 * Wavlake embed regex
 */
export const WavlakeRegex =
  /https?:\/\/(?:player\.|www\.)?wavlake\.com\/(?!top|new|artists|account|activity|login|preferences|feed|profile)(?:(?:track|album)\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|[a-z-]+)/i;
