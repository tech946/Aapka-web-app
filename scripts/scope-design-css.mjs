/**
 * Scope a stylesheet from the redesign repo (apkatourism-new-design) so it
 * only applies inside an `.at-site` wrapper.
 *
 *   node scripts/scope-design-css.mjs <in.css> <out.css>
 *
 * Every selector is prefixed with `:where(.at-site)`. `:where()` adds zero
 * specificity, so the design's own cascade is untouched — the rules simply
 * stop matching anything outside `.at-site`, which keeps the redesign's
 * generic class names (.container, .row, .btn, .footer…) off the pages that
 * have not been migrated yet, and off the dashboard.
 *
 *   :root / html   left global (tokens, text-size-adjust)
 *   body           becomes the wrapper itself
 *   @keyframes     left alone
 */
import fs from 'node:fs';
import postcss from 'postcss';

const SCOPE = ':where(.at-site)';

function scopeSelector(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s.startsWith(':root') || s === 'html' || s.startsWith('html ')) return s;
  if (s === 'body') return SCOPE;
  if (s.startsWith('body')) return SCOPE + s.slice(4);
  return `${SCOPE} ${s}`;
}

function insideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('usage: node scripts/scope-design-css.mjs <in.css> <out.css>');
  process.exit(1);
}

const root = postcss.parse(fs.readFileSync(input, 'utf8'), { from: input });
root.walkRules((rule) => {
  if (insideKeyframes(rule)) return;
  rule.selectors = rule.selectors.map(scopeSelector);
});
fs.writeFileSync(output, root.toString());
console.log(`scoped ${input} -> ${output}`);
