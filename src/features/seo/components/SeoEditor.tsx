'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, Field } from '@/components/dashboard/kit';
import { errorMessage } from '@/lib/api/client';
import { useDeleteSeo, useSaveSeo, useSeoEntry } from '../hooks';
import { blockTypes, placementTag, schemaTitle } from '../jsonld';
import { META_DESCRIPTION_MAX, META_TITLE_MAX, pageSeoInputSchema, type PageSchemaItem, type SeoCatalogItem } from '../schema';
import { SchemaModal } from './SchemaModal';

type Editing = { item: PageSchemaItem | null } | null;

export function SeoEditor({ page, canWrite }: { page: SeoCatalogItem; canWrite: boolean }) {
  const { data: entry, isLoading } = useSeoEntry(page.key);
  const save = useSaveSeo();
  const remove = useDeleteSeo();
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<PageSchemaItem | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setMetaTitle(entry?.metaTitle ?? '');
    setMetaDescription(entry?.metaDescription ?? '');
  }, [entry, page.key]);

  const schemas = entry?.schemas ?? [];
  const metaDirty = metaTitle !== (entry?.metaTitle ?? '') || metaDescription !== (entry?.metaDescription ?? '');

  const persist = async (next: { metaTitle?: string; metaDescription?: string; schemas?: PageSchemaItem[] }, success: string) => {
    const parsed = pageSeoInputSchema.safeParse({
      key: page.key,
      path: page.path,
      label: page.label,
      metaTitle: next.metaTitle ?? entry?.metaTitle ?? '',
      metaDescription: next.metaDescription ?? entry?.metaDescription ?? '',
      schemas: next.schemas ?? schemas,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(issue ? `${issue.path.join(' › ') || 'Form'}: ${issue.message}` : 'Please check the form.');
      return false;
    }
    try {
      await save.mutateAsync(parsed.data);
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  };

  const saveMeta = () => persist({ metaTitle, metaDescription }, 'Meta title and description saved.');

  const saveSchema = async (item: PageSchemaItem) => {
    const exists = schemas.some((s) => s.id === item.id);
    const next = exists ? schemas.map((s) => (s.id === item.id ? item : s)) : [...schemas, item];
    if (await persist({ schemas: next }, exists ? 'Schema updated.' : 'Schema added to the page.')) setEditing(null);
  };

  const toggleSchema = (item: PageSchemaItem) =>
    persist(
      { schemas: schemas.map((s) => (s.id === item.id ? { ...s, enabled: !s.enabled } : s)) },
      item.enabled ? 'Schema turned off.' : 'Schema turned on.',
    );

  const deleteSchema = async () => {
    if (!deleting) return;
    if (await persist({ schemas: schemas.filter((s) => s.id !== deleting.id) }, 'Schema deleted.')) setDeleting(null);
  };

  const onReset = async () => {
    try {
      await remove.mutateAsync(page.key);
      setConfirmReset(false);
      toast.success('Everything saved for this page was cleared.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const busy = save.isPending || isLoading;

  return (
    <div className='dk-seo__editor'>
      <div className='dk-card dk-seo__head'>
        <div className='dk-seo__head-text'>
          <p className='dk-card__title'>{page.group}</p>
          <h2 className='dk-seo__title'>{page.label}</h2>
          <code className='dk-seo__path'>{page.path}</code>
        </div>
        <div className='dk-seo__actions'>
          <a className='btn_secondary' href={page.path} target='_blank' rel='noopener noreferrer'>
            <ExternalLink size={14} aria-hidden /> View page
          </a>
          {canWrite && page.customized && (
            <button type='button' className='btn_secondary' onClick={() => setConfirmReset(true)} disabled={remove.isPending}>
              <RotateCcw size={14} aria-hidden /> Clear all
            </button>
          )}
        </div>
      </div>

      <section className='dk-card'>
        <div className='dk-seo__card-head'>
          <h3 className='dk-card__title'>Search result</h3>
          <button type='button' className='btn_primary' onClick={saveMeta} disabled={!canWrite || busy || !metaDirty}>
            <Save size={14} aria-hidden /> {save.isPending ? 'Saving…' : 'Save meta'}
          </button>
        </div>
        <fieldset className='dk-seo__fields' disabled={!canWrite || isLoading}>
          <Field label='Meta title' htmlFor='seo-title' hint={`${metaTitle.length}/${META_TITLE_MAX} · leave empty to keep the page's own title`}>
            <input id='seo-title' maxLength={META_TITLE_MAX} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </Field>
          <Field
            label='Meta description'
            htmlFor='seo-desc'
            hint={`${metaDescription.length}/${META_DESCRIPTION_MAX} · leave empty to keep the page's own description`}
          >
            <textarea id='seo-desc' rows={3} maxLength={META_DESCRIPTION_MAX} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </Field>
        </fieldset>
        <div className='dk-seo__serp' aria-label='Google preview'>
          <span className='dk-seo__serp-url'>aapkatourism.com{page.path === '/' ? '' : page.path}</span>
          <span className='dk-seo__serp-title'>{metaTitle || page.label}</span>
          <span className='dk-seo__serp-desc'>{metaDescription || 'The page’s own description is used.'}</span>
        </div>
      </section>

      <section className='dk-card'>
        <div className='dk-seo__card-head'>
          <div>
            <h3 className='dk-card__title'>Schema (JSON-LD)</h3>
            <p className='dk-muted dk-seo__note'>Travel Agency and Website schema are already added to every page. Add page-specific schema here.</p>
          </div>
          <button type='button' className='btn_primary' onClick={() => setEditing({ item: null })} disabled={!canWrite || busy}>
            <Plus size={14} aria-hidden /> Add schema
          </button>
        </div>

        {isLoading ? (
          <p className='dk-muted'>Loading…</p>
        ) : schemas.length === 0 ? (
          <div className='dk-seo__empty'>
            <b>No schema on this page yet.</b>
            <span>Paste your own JSON-LD or build one with a form, then choose where on the page it goes.</span>
          </div>
        ) : (
          <ul className='dk-seo__schemas'>
            {schemas.map((item) => (
              <li key={item.id} className={'dk-seo__schema' + (item.enabled ? '' : ' is-off')}>
                <div className='dk-seo__schema-main'>
                  <span className='dk-seo__schema-title'>{schemaTitle(item)}</span>
                  <span className='dk-seo__schema-meta'>
                    {blockTypes(item.block).map((t) => (
                      <code key={t}>{t}</code>
                    ))}
                    <span className='dk-seo__schema-place'>{placementTag(item)}</span>
                    <span className='dk-seo__schema-src'>{item.block.type === 'custom' ? 'Pasted JSON-LD' : 'Form'}</span>
                  </span>
                </div>
                <div className='dk-seo__schema-actions'>
                  <label className='dk-seo__switch' title={item.enabled ? 'On the page' : 'Hidden from the page'}>
                    <input type='checkbox' checked={item.enabled} onChange={() => toggleSchema(item)} disabled={!canWrite || busy} />
                    <span aria-hidden />
                    <em>{item.enabled ? 'On' : 'Off'}</em>
                  </label>
                  <button type='button' className='table_action_btn' title='Edit' onClick={() => setEditing({ item })} disabled={!canWrite}>
                    <Pencil aria-hidden />
                  </button>
                  <button
                    type='button'
                    className='table_action_btn table_action_delete'
                    title='Delete'
                    onClick={() => setDeleting(item)}
                    disabled={!canWrite}
                  >
                    <Trash2 aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && <SchemaModal initial={editing.item} path={page.path} busy={save.isPending} onSave={saveSchema} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title='Delete this schema?'
          message={`“${schemaTitle(deleting)}” is removed from ${page.path}. This cannot be undone.`}
          confirmLabel='Delete'
          danger
          busy={save.isPending}
          onConfirm={deleteSchema}
          onCancel={() => setDeleting(null)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title='Clear everything for this page?'
          message='The meta title, description and every schema saved for this page are removed. The page goes back to its built-in title and description.'
          confirmLabel='Clear all'
          danger
          busy={remove.isPending}
          onConfirm={onReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
