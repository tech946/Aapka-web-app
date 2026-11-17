import 'server-only';
import * as cheerio from 'cheerio';

const ALLOWED_TAGS = new Set([
  'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
  'blockquote', 'figure', 'figcaption', 'img', 'hr', 'code', 'pre',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title']),
};

const URL_ATTRIBUTES = new Set(['href', 'src']);
const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

export function sanitizeHtml(html: string): string {
  if (!html.trim()) return '';
  const $ = cheerio.load(html, null, false);

  $('script, style, iframe, object, embed, form, input, button, textarea, select, link, meta').remove();

  $('*').each((_, node) => {
    if (node.type !== 'tag') return;
    const el = $(node);
    const tag = node.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(el.contents());
      return;
    }

    const allowed = ALLOWED_ATTRIBUTES[tag] ?? new Set<string>();
    for (const name of Object.keys(node.attribs)) {
      const value = node.attribs[name].trim();
      const keep = allowed.has(name) && (!URL_ATTRIBUTES.has(name) || SAFE_URL.test(value));
      if (!keep) el.removeAttr(name);
    }

    if (tag === 'a' && el.attr('target') === '_blank') el.attr('rel', 'noopener noreferrer');
    if (tag === 'img' && !el.attr('src')) el.remove();
  });

  return $.html();
}
