import { nip19Decode } from "service/api";

export enum ContentType {
  text = "text",
  newline = 'newline',
  mention = 'mention',
  topic = 'topic',
  link = 'link'
}

export type Content = {
  type: ContentType;
  value: string;
}

export enum MediaType {
  image = "image",
  video = "video",
  link = "link"
}

export type Media = {
  type: MediaType;
  url: string;
}

export const parseContent = content => {
  const text = content.trim();
  const result: object[] = [];
  let buffer = "", i = 0;

  const push = (type, text, value = null) => {
    if (buffer) {
      result.push({type: ContentType.text, value: buffer});
      buffer = "";
    }

    result.push({type, value: value || text});
    i += text.length;
  }

  for (; i < text.length; ) {
    const tail = text.slice(i);

    const newLine = tail.match(/^\n+/);

    if (newLine) {
      push(ContentType.newline, newLine[0]);
      continue;
    }

    const mentionMatch = tail.match(/^#\[\d+\]/i);

    if (mentionMatch) {
      push(ContentType.mention, mentionMatch[0]);
      continue;
    }

    const topicMatch = tail.match(/^#\w+/i);

    if (topicMatch) {
      push(ContentType.topic, topicMatch[0]);
      continue;
    }

    const bech32Match = tail.match(/^(nostr:)?n(event|ote|profile|pub)1[\d\w]+/i);

    if (bech32Match) {
      try {
        const entity = bech32Match[0].replace("nostr:", "");
        const {type, data} = nip19Decode(entity);

        push(`nostr:${type}`, bech32Match[0], {data, entity} as any);
        continue;
      } catch (e) {
        console.log(e);
      }
    }

    const urlMatch = tail.match(
      /^((http|ws)s?:\/\/)?[-a-z0-9@:%_\+~#=\.]+\.[a-z]{1,6}[-a-z0-9:%_\+~#\?!&\/=;\.]*/gi
    );

    // Skip url if it's just the end of a filepath
    if (urlMatch && result.length && !last(result)?.value.endsWith("/")) {
      let url = urlMatch[0];

      // Skip ellipses and very short non-urls
      if (!url.match(/\.\./) && url.length > 4) {
        // It's common for punctuation to end a url, trim it off
        if (url.match(/[\.\?,:]$/)) {
          url = url.slice(0, -1);
        }

        if (!url.match("://")) {
          url = "https://" + url;
        }

        push(ContentType.link, urlMatch[0], url);
        continue;
      }
    }
    
    const wordMatch = tail.match(/^[\w\d]+ ?/i);

    if (wordMatch) {
      buffer += wordMatch[0];
      i += wordMatch[0].length;
    } else {
      buffer += text[i];
      i += 1;
    }
  }

  if (buffer) {
    result.push({
      type: ContentType.text,
      value: buffer
    });
  }

  return result as Content[];
}

export const parseMedia = url => {
  let result;

  if (url.match(".(jpg|jpeg|png|gif)")) {
    result = {type: "image", url}
  } else if (url.match(".(mov|mp4)")) {
    result = {type: "video", url}
  } else {
    result = {type: "link", url}
  }

  return result as Media;
}

function last(list) {
  return (Array.isArray(list) || typeof list === 'string') && list.length > 0
    ? list[list.length - 1]
    : list;
}
