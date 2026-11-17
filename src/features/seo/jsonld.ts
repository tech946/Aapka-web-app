import { SCHEMA_BLOCK_META } from '@/features/blog/structured-data/catalog';
import type { SchemaBlock } from '@/features/blog/structured-data/schema';
import { PLACEMENT_META, type PageSchemaItem } from './schema';

export interface JsonLdCheck {
  ok: boolean;
  error: string | null;
  types: string[];
  warnings: string[];
  cleaned: string;
  strippedScript: boolean;
}

const SCRIPT_OPEN = /^\s*<script\b[^>]*>/i;
const SCRIPT_CLOSE = /<\/script>\s*$/i;

export function stripScriptTag(text: string): { text: string; stripped: boolean } {
  if (!SCRIPT_OPEN.test(text) && !SCRIPT_CLOSE.test(text)) return { text: text.trim(), stripped: false };
  return { text: text.replace(SCRIPT_OPEN, '').replace(SCRIPT_CLOSE, '').trim(), stripped: true };
}

function positionMessage(text: string, error: unknown): string {
  const message = error instanceof Error ? error.message : 'Invalid JSON.';
  const match = message.match(/position (\d+)/i);
  if (!match) return message;
  const pos = Number(match[1]);
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  return `${message.replace(/\s*in JSON at position \d+.*$/i, '').replace(/\s*\(line \d+ column \d+\)$/i, '')} — line ${line}, column ${col}.`;
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  const type = record['@type'];
  if (typeof type === 'string') out.add(type);
  if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && out.add(t));
  if (Array.isArray(record['@graph'])) collectTypes(record['@graph'], out);
}

function topLevel(parsed: unknown): Record<string, unknown>[] {
  const items = Array.isArray(parsed) ? parsed : [parsed];
  return items.filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === 'object' && !Array.isArray(i));
}

export function checkJsonLd(raw: string): JsonLdCheck {
  const { text, stripped } = stripScriptTag(raw);
  const base = { cleaned: text, strippedScript: stripped, types: [] as string[], warnings: [] as string[] };
  if (!text) return { ...base, ok: false, error: 'Paste your JSON-LD here.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ...base, ok: false, error: positionMessage(text, error) };
  }

  const items = topLevel(parsed);
  if (items.length === 0) return { ...base, ok: false, error: 'JSON-LD must be an object, or a list of objects.' };

  const types = new Set<string>();
  collectTypes(parsed, types);
  const warnings: string[] = [];

  const missingType = items.some((i) => typeof i['@type'] !== 'string' && !Array.isArray(i['@type']) && !Array.isArray(i['@graph']));
  if (missingType) return { ...base, ok: false, types: [...types], error: 'Every top-level object needs an "@type" (or an "@graph" list).' };

  const contexts = items.map((i) => i['@context']);
  if (contexts.some((c) => c === undefined)) warnings.push('Add "@context": "https://schema.org" to each top-level object so search engines know the vocabulary.');
  else if (contexts.some((c) => typeof c === 'string' && !/schema\.org/i.test(c))) warnings.push('"@context" is not schema.org. Google only reads schema.org types.');
  if (stripped) warnings.push('The <script> tag was removed. Paste only the JSON; the site adds the tag for you.');

  return { ...base, ok: true, error: null, types: [...types], warnings };
}

export function formatJsonLd(raw: string): string | null {
  const { text } = stripScriptTag(raw);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return null;
  }
}

export function blockTypes(block: SchemaBlock): string[] {
  if (block.type !== 'custom') return [SCHEMA_BLOCK_META[block.type].schemaType];
  const check = checkJsonLd(block.json);
  return check.types.length ? check.types : ['JSON-LD'];
}

export function schemaTitle(item: PageSchemaItem): string {
  if (item.label) return item.label;
  if (item.block.type === 'custom') return blockTypes(item.block).join(', ');
  const meta = SCHEMA_BLOCK_META[item.block.type];
  const name = 'name' in item.block && typeof item.block.name === 'string' ? item.block.name : '';
  return name ? `${meta.label}: ${name}` : meta.label;
}

export function placementTag(item: PageSchemaItem): string {
  return PLACEMENT_META[item.placement].tag;
}
