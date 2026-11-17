/* Package details (PDP) data helpers: turn the production package row into
   what the redesigned detail page shows. Nothing here changes a price or a
   booking rule — those stay in each page. */

import { plain } from '../listing/listing-data';

/** "4N/5D", "5 Days", "3 Nights" or '' (day tours). */
export function durationLabel(days?: number | null, nights?: number | null): string {
  const d = days ?? 0;
  const n = nights ?? (d > 0 ? d - 1 : 0);
  if (d > 0 && n > 0) return `${n}N/${d}D`;
  if (d > 0) return `${d} Day${d === 1 ? '' : 's'}`;
  if (n > 0) return `${n} Night${n === 1 ? '' : 's'}`;
  return '';
}

const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
const ACRONYMS = new Set(['UAE', 'BBQ', 'DXB', 'AUH', 'AED', 'BAPS', 'VIP', 'USA', 'UK', 'GCC', 'ATV']);

/** "AAPKA 4N 5D DUBAI HOLIDAY PACKAGE" → "Aapka 4N 5D Dubai Holiday Package".
    Words with digits (4N, 3N/4D) and known acronyms keep their capitals;
    joining words stay lower case except at the start. */
export function titleCase(text: string): string {
  return String(text ?? '')
    .trim()
    .split(/(\s+)/)
    .map((part, i) => {
      if (!part.trim()) return part;
      // durations: 4N, 5D, 3N/4D
      if (/^\d+[nd](\/\d+[nd])?$/i.test(part)) return part.toUpperCase();
      if (i > 0 && MINOR_WORDS.has(part.toLowerCase())) return part.toLowerCase();
      // each run of letters on its own: "off[dxb]" → "Off[DXB]", "half-day" → "Half-Day", "it's" → "It's";
      // a run right after a digit stays lower case ("1st")
      return part.replace(/[A-Za-z][A-Za-z'’]*/g, (w, at: number) => {
        if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
        if (at > 0 && /\d/.test(part[at - 1])) return w.toLowerCase();
        return w[0].toUpperCase() + w.slice(1).toLowerCase();
      });
    })
    .join('');
}

/** Plain text exists (not just empty tags / whitespace). */
export function hasText(value?: string | null): boolean {
  return plain(value).length > 0;
}

export interface ItineraryDay {
  /** 1-based; from "Day 3: …" in the heading, else the row's position */
  day: number;
  title: string;
  /** the day's own bold sub-headings ("Dubai Airport Pickup · Hotel Check-in") */
  summary: string;
  html: string;
}

const DAY_PREFIX = /^day\s*0*(\d+)\s*[:\-–—.|]?\s*/i;

/** Itinerary rows → day cards. Rows with neither heading nor body are dropped. */
export function itineraryDays(
  rows: Array<{ heading?: string | null; desc?: string | null }> | null | undefined,
  copy: (text: string) => string = (t) => t,
): ItineraryDay[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => hasText(r?.heading) || hasText(r?.desc))
    .map((r, i) => {
      const heading = plain(copy(r.heading ?? ''));
      const m = heading.match(DAY_PREFIX);
      const title = (m ? heading.slice(m[0].length) : heading) || `Day ${i + 1}`;
      const html = copy(r.desc ?? '');
      // paragraphs that are nothing but bold text are the day's sub-headings
      const heads = [...html.matchAll(/<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>/gi)]
        .map((h) => plain(h[1]))
        .filter(Boolean);
      return {
        day: m ? Number(m[1]) : i + 1,
        title,
        summary: heads.slice(0, 4).join(' · '),
        html,
      };
    });
}

export interface DayStop {
  title: string;
  /** plain text under the sub-heading; may be empty */
  text: string;
}

/** One day's CMS HTML → its stops for the itinerary board: each bold-only
    paragraph starts a stop, the paragraphs after it are its text. A day
    without sub-headings is one stop titled with the day's own title. */
export function dayStops(html: string, fallbackTitle: string): DayStop[] {
  const paras = [...String(html ?? '').matchAll(/<(p|li|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({
    head: /^\s*<(strong|b)>[\s\S]*<\/\1>\s*$/i.test(m[2]) || /^h/i.test(m[1]),
    text: plain(m[2]),
  }));
  const stops: DayStop[] = [];
  for (const p of paras) {
    if (!p.text) continue;
    // "Experience Highlights:" and the like label the stop above, not a new one
    const label = p.head && /:\s*$/.test(p.text) && stops.length > 0;
    if (label) stops[stops.length - 1].text = (stops[stops.length - 1].text + ' ' + p.text).trim();
    else if (p.head) stops.push({ title: p.text, text: '' });
    else if (stops.length) stops[stops.length - 1].text = (stops[stops.length - 1].text + ' ' + p.text).trim();
    else stops.push({ title: fallbackTitle, text: p.text });
  }
  if (!stops.length) {
    const text = plain(html);
    return [{ title: fallbackTitle, text }];
  }
  return stops;
}

/** CMS inclusion / exclusion HTML, tidied for the dotted list: empty
    paragraphs go, and a paragraph that is nothing but bold text is marked
    `is-head` so it reads as a sub-heading instead of getting a bullet. */
export function listHtml(html: string): string {
  return html
    .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<p>\s*<(strong|b)>((?:(?!<\/?(?:strong|b)>)[\s\S])*?)<\/\1>\s*<\/p>/gi, '<p class="is-head"><$1>$2</$1></p>');
}

/** "AED 1,700" for whole amounts, "AED 1,712.50" otherwise. */
export function money(n: number | null | undefined): string {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const digits = Number.isInteger(v) ? 0 : 2;
  return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}

/** Holiday-type label → the singular used in the kicker ("Offer Packages" → "Offer Package"). */
export function singular(label: string): string {
  return label.replace(/s$/i, '');
}
