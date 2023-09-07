export enum HomeFilterMsg {
  all = 'All',
  article = 'Article',
  media = 'Media',
  zh = 'chinese',
	foodstr = 'Foodstr',
	nostr = 'Nostr',
	dev = 'Dev',
	bitcoin = 'Bitcoin'
}

export function containsChinese(text: string): boolean {
  // Regular expression to match Chinese characters (Simplified and Traditional)
  const chineseRegex = /[\u4e00-\u9fa5]/;
  // Check if the text contains any Chinese characters
  return chineseRegex.test(text);
}

export function containsJapanese(text: string): boolean {
  // Regular expression to match Japanese characters (Hiragana, Katakana, and Kanji)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4e00-\u9fa5]/;

  // Check if the text contains any Japanese characters
  return japaneseRegex.test(text);
}

export function isPrimaryChineseText(text: string): boolean {
  // Check if the browser supports Intl.Segmenter
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') {
    throw new Error('Intl.Segmenter is not supported in this environment.');
  }

  // Create a segmenter for Chinese text
  const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });

  // Segment the input text
  const segments = Array.from(segmenter.segment(text));

  // Count the number of segments
  const chineseSegmentCount = segments.filter((segment) => {
    // Check if the segment contains Chinese characters (Unicode range)
    return /[\u4E00-\u9FFF]/.test(segment.segment);
  }).length;

	const otherSegmentCount = segments.filter((segment) => {
    // Check if the segment contains Chinese characters (Unicode range)
    return !/[\u4E00-\u9FFF]/.test(segment.segment);
  }).length; 

  // Determine if it's primary Chinese text based on your criteria
  // For example, you can consider it primary if the majority of segments are in Chinese
  const isPrimary = chineseSegmentCount >= otherSegmentCount;

	//console.log(segments, chineseSegmentCount, otherSegmentCount);

  return chineseSegmentCount > 0;
}
