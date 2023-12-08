import { ParsedFragment, transformText } from "components/PostItems/PostContent/text";

const TextCache = new Map<string, Array<ParsedFragment>>();

export function transformTextCached(id: string, content: string, tags: Array<Array<string>>) {
  console.log("textCache size:", TextCache.size, content);
  if (content.length > 0) {
    const cached = TextCache.get(id);
    if (cached) return cached;
    const newCache = transformText(content, tags);
    TextCache.set(id, newCache);
    return newCache;
  }
  return [];
}

export function doTextTransformer(id: string, content: string, tags: Array<Array<string>>) {
  return transformTextCached(id, content, tags);
}
