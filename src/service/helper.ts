export function extractImageUrls(text: string): {
  imageUrls: string[];
  modifiedText: string;
} {
  // First, use a regular expression to find all URLs that start with "http" or "https"
  const urlRegex = /https?:\/\/\S+/g;
  const matches = text.match(urlRegex);

  // Initialize the imageUrls array to an empty array
  let imageUrls: string[] = [];

  // If matches were found, filter out any URLs that do not end with a common image file extension
  if (matches) {
    const imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    imageUrls = matches.filter(url =>
      imageFileExtensions.some(ext => url.endsWith(ext)),
    );
  }

  // Replace all the image URLs with an empty string
  let modifiedText = text;
  for (const url of imageUrls) {
    modifiedText = text.replace(url, '');
  }

  return { imageUrls, modifiedText };
}

export function isValidWssUrl(url: string): boolean {
  // First, check if the URL starts with "wss://"
  if (!url.startsWith('wss://')) {
    return false;
  }

  // Next, check if the URL contains any characters that are not allowed in
  // a URL, such as spaces or control characters
  const illegalCharacters = /[\s\u0000-\u001F\u007F-\u009F]/;
  if (illegalCharacters.test(url)) {
    return false;
  }

  // Finally, check if the URL has a valid domain name using a regular expression
  const domainNameRegex =
    /^wss:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainNameRegex.test(url);
}
