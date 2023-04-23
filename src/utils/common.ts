import { v4 as uuidv4 } from 'uuid';

export const getDraftId = () => uuidv4();

export function matchSocialMedia(url) {
  const socialMediaRegex = /(www\.)?(facebook|twitter|instagram|linkedin|youtube|vimeo|hulu|netflix|twitch|dailymotion|tiktok)\.com/i;
  
  if (socialMediaRegex.test(url)) {
    const socialMedia = url.match(socialMediaRegex)[2].toLowerCase();
    return socialMedia.charAt(0).toUpperCase() + socialMedia.slice(1);
  }

  return "";
}
