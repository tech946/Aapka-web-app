interface BaseField {
  name: string;
  label: string;
  hint?: string;
}

export type CmsField =
  | (BaseField & { type: 'text'; maxLength?: number })
  | (BaseField & { type: 'textarea'; rows?: number; maxLength?: number })
  | (BaseField & { type: 'url' })
  | (BaseField & { type: 'image' })
  | (BaseField & { type: 'select'; options: { value: string; label: string }[] })
  | (BaseField & { type: 'richtext' })
  | (BaseField & { type: 'group'; fields: CmsField[] })
  | (BaseField & { type: 'list'; itemLabel: string; titleField?: string; maxItems?: number; fields: CmsField[] });

export type CmsValue = string | CmsObject | CmsObject[];
export type CmsObject = { [name: string]: CmsValue };

const LIMITS = { text: 300, textarea: 5000, richtext: 200_000, url: 1000, list: 100 };
const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;

type Sanitizer = (html: string) => string;

function asString(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function normalizeField(field: CmsField, raw: unknown, sanitize?: Sanitizer, fallback?: CmsValue): CmsValue {
  switch (field.type) {
    case 'text':
      return asString(raw).trim().slice(0, field.maxLength ?? LIMITS.text);
    case 'textarea':
      return asString(raw).trim().slice(0, field.maxLength ?? LIMITS.textarea);
    case 'url':
    case 'image': {
      const value = asString(raw).trim().slice(0, LIMITS.url);
      return value && SAFE_URL.test(value) ? value : '';
    }
    case 'select': {
      const value = asString(raw);
      return field.options.some((o) => o.value === value) ? value : (field.options[0]?.value ?? '');
    }
    case 'richtext': {
      const html = asString(raw).slice(0, LIMITS.richtext);
      return sanitize ? sanitize(html) : html;
    }
    case 'group':
      return normalizeFields(field.fields, raw, sanitize, asObject(fallback) as CmsObject);
    case 'list':
      return (Array.isArray(raw) ? raw : [])
        .slice(0, field.maxItems ?? LIMITS.list)
        .map((item) => normalizeFields(field.fields, item, sanitize));
  }
}

export function normalizeFields(fields: CmsField[], raw: unknown, sanitize?: Sanitizer, defaults?: CmsObject): CmsObject {
  const source = asObject(raw);
  return Object.fromEntries(
    fields.map((f) => {
      const fallback = defaults?.[f.name];
      const missing = !Object.hasOwn(source, f.name);
      return [f.name, missing && fallback !== undefined ? fallback : normalizeField(f, source[f.name], sanitize, fallback)];
    }),
  );
}

export function emptyValue(field: CmsField): CmsValue {
  if (field.type === 'group') return emptyObject(field.fields);
  if (field.type === 'list') return [];
  if (field.type === 'select') return field.options[0]?.value ?? '';
  return '';
}

export function emptyObject(fields: CmsField[]): CmsObject {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}
