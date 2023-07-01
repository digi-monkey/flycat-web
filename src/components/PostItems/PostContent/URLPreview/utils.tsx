import { getSpotifyId, getTidalId, getTweetId, getTwitchId, getYouTubeVideoId } from "utils/content";

export async function urlToHTML({ url }: {url: string}) {
  const result = url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);
  if (!Array.isArray(result)) return;

  let _url = result[0];
  _url = _url.replaceAll('+', ' ').replaceAll('"', "");

  const link = new URL(_url);
  const suffix = link.pathname.substr(link.pathname.length - 4).toLowerCase();
  const suffix2 = link.pathname.substr(link.pathname.length - 5).toLowerCase();
  const suffix3 = link.pathname.substr(link.pathname.length - 4).toLowerCase();
  const suffix4 = link.pathname.substr(link.pathname.length - 5).toLowerCase();
  const suffix5 = link.pathname.substr(link.pathname.length - 4).toLowerCase();
  const imgSufs = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const audioSufs = ['.mp3', '.ogg', '.wav'];
  const videoSufs = ['.webm', '.mp4', '.mov', '.mpeg4'];

  // images url
  if (imgSufs.includes(suffix) || imgSufs.includes(suffix2)) {
    return `<img src="${_url}" alt="images" />`;
  } 

  // audio url
  if (audioSufs.includes(suffix5)) {
    return `<audio controls src="${_url}" />`;
  }

  // video url
  if (videoSufs.includes(suffix3) || videoSufs.includes(suffix4)) {
    return `<video controls src="${_url}" />`;
  }
  
  // YouTube
  if (getYouTubeVideoId(_url)) {
    return `<iframe style="aspect-ratio: 16 / 9;width:100%" src="https://www.youtube.com/embed/${getYouTubeVideoId(_url)}" allowfullscreen></iframe>`
  }

  // TikTok
  if (_url.indexOf("tiktok.com") > -1) {
    const vid = _url.split('video/');
    return `<iframe style="aspect-ratio: 9 / 13;width:100%" src="https://www.tiktok.com/embed/v2/${vid[1]}?embedFrom=oembed&autoplay=false" allowfullscreen sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"></iframe>`;
  }

  // Nostrplebs
  if(_url.indexOf("spaces.nostrplebs.com") > -1 || (_url.indexOf("nostrnests.com/") > -1 && link.pathname.substring(1).indexOf("/") == -1)){
    return `<iframe src="${_url}" allow="microphone *;" width="450" height="700"></iframe>`;
  }
  
  // Twitch
  if(getTwitchId(_url)){
    const { type, id } = getTwitchId(_url) as { type: string, id: string };

    const turl = type === "video" ? 
      `https://player.twitch.tv/?video=${id}&parent=flycat.club&autoplay=false` : 
      `https://player.twitch.tv/?channel=${id}&parent=flycat.club&muted=true`;

    return `<iframe src="${turl}" allowfullscreen height="378" width="620"></iframe>`
  }
  
  // Spotify
  if (getSpotifyId(_url)) {
    const spotifyUrl = `https://open.spotify.com/embed/${getSpotifyId(_url)}?utm_source=generator`;
    return `<iframe src="${spotifyUrl}" width="100%" height="352" allowfullscreen allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  }

  // Tidal
  if (getTidalId(_url)) {
    return `<iframe src="https://embed.tidal.com/${getTidalId(_url)}?layout=gridify" allowfullscreen height="378" width="620"></iframe>`
  }

  // Wavlake
  if(_url.indexOf("wavlake.com") > -1 && _url.match(/\/(track)\/([a-zA-Z0-9]+)/)){
    const wavlakeUrl = _url.split('track');
    return `<iframe src="https://embed.wavlake.com/track${wavlakeUrl[1]}" width="80%" height="360" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  }
  
  // Odysee
  if(_url.indexOf("odysee.com") > -1){
    const atIdx = _url.indexOf("@");

    if (atIdx > -1) {
      return `<iframe style="aspect-ratio: 16 / 9;width:100%" src="${_url.substring(0, atIdx - 1)}/$/embed/${_url.substring(atIdx)}" allowfullscreen></iframe>`
    }
  }
  
  // Apple
  if (_url.indexOf("music.apple.com") > -1) {
    return `<iframe height="180" src='${_url.replace("music.apple.com", "embed.music.apple.com")}' allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"></iframe>`
  }

  // Soundcloud
  if (_url.indexOf("soundcloud.com") > -1) {
    return `<iframe width="100%" height="300" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURI(_url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>`
  }

  // Tweet
  if (getTweetId(_url)) {
    const id = getTweetId(_url);

    return `<div class="tweet" style="width:100%" status="${id}"></div>`;
  }

  return "";
}

export function buildNote(url: string) {
  const parse = new URL(url);
  if (parse.host !== "twitter.com") return;

  document.querySelectorAll(".tweet").forEach(item => {
    item.innerHTML = '';

    const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
    window.twttr.widgets.createTweet(item.getAttribute('status'), item, isDarkTheme.matches && { theme: 'dark' }).then(() => {
      const len = item.childNodes.length;
      if (len === 1) return;
      for (let i = 1; i < len; i++) {
        item.removeChild(item.childNodes[i]);
      }
    });
  });
}
