import 'server-only';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cmsCacheTag, type CmsPageDefinition } from './define';
import { normalizeFields, type CmsObject } from './fields';

async function readSaved(key: string): Promise<unknown | null> {
  const { data, error } = await supabaseAdmin.from('cms_pages').select('content').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export async function getCmsContent<T extends CmsObject>(definition: CmsPageDefinition<T>): Promise<T> {
  try {
    const saved = await unstable_cache(() => readSaved(definition.key), ['cms-page', definition.key], {
      tags: [cmsCacheTag(definition.key)],
    })();
    return saved ? (normalizeFields(definition.fields, saved, undefined, definition.defaults) as T) : definition.defaults;
  } catch (error) {
    console.error('[cms] read failed', definition.key, error);
    return definition.defaults;
  }
}
