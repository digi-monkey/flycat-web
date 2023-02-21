export interface UrlMetadata {
  url?: string;
  title?: string;
  image?: string;
  description?: string;
  siteName?: string;
}

export async function getUrlMetadata(url: string): Promise<UrlMetadata> {
  const endpoint: string = 'https://flycat-ogp.deno.dev/';
  const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
  const metadata: UrlMetadata = await response.json();
  return metadata;
}
