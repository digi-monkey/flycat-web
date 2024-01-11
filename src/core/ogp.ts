import { fetchWithTimeout } from './api/fetch';

export interface UrlMetadata {
  url?: string;
  title?: string;
  image?: string;
  description?: string;
  siteName?: string;
}

export async function getUrlMetadata(url: string): Promise<UrlMetadata> {
  const endpoint = 'https://flycat-ogp.deno.dev/';
  const ogpUrl = `${endpoint}?url=${encodeURIComponent(url)}`;
  const timeout = 2000;
  const response = await fetchWithTimeout(ogpUrl, timeout, {
    cache: 'force-cache',
  });
  const metadata: UrlMetadata = await response.json();
  return metadata;
}
