import MarkdownIt from 'markdown-it';

// Initialize a markdown parser
export const mdParser = new MarkdownIt();

// save multiple breaks, see: https://github.com/markdown-it/markdown-it/issues/211#issuecomment-508380611
const defaultParagraphRenderer =
  mdParser.renderer.rules.paragraph_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
mdParser.renderer.rules.paragraph_open = function (
  tokens,
  idx,
  options,
  env,
  self,
) {
  let result = '';
  if (idx > 1) {
    const inline = tokens[idx - 2];
    const paragraph = tokens[idx];
    if (
      inline.type === 'inline' &&
      inline.map &&
      inline.map[1] &&
      paragraph.map &&
      paragraph.map[0]
    ) {
      const diff = paragraph.map[0] - inline.map[1];
      if (diff > 0) {
        result = '<br>'.repeat(diff);
      }
    }
  }
  return result + defaultParagraphRenderer(tokens, idx, options, env, self);
};
