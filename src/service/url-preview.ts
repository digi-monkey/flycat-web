import cheerio from 'cheerio';

export interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
}

export async function generatePreview(url: string): Promise<PreviewData> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';
  const image = $('meta[property="og:image"]').attr('content');

  return { title, description, image };
}
