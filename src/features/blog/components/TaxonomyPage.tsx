'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, Field, Modal, PageHeader, type Column } from '@/components/dashboard/kit';
import { errorMessage } from '@/lib/api/client';
import { fieldErrors, type FieldErrors } from '@/lib/forms';
import { slugify } from '@/lib/slug';
import { TAXONOMY_META, type TaxonomyKind } from '../constants';
import { useBlogTerms, useDeleteTerm, useSaveTerm } from '../hooks';
import { blogTermInputSchema } from '../schemas';
import type { BlogTerm } from '../types';

type Editing = { term?: BlogTerm } | null;

export function TaxonomyPage({ kind }: { kind: TaxonomyKind }) {
  const meta = TAXONOMY_META[kind];
  const { data: terms = [], isLoading, error } = useBlogTerms(kind);
  const deleteTerm = useDeleteTerm(kind);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<BlogTerm | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? terms.filter((t) => `${t.name} ${t.slug}`.toLowerCase().includes(q)) : terms;
  }, [terms, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTerm.mutateAsync(deleting.id);
      toast.success(`${meta.singular} deleted.`);
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<BlogTerm>[] = [
    { key: 'name', header: 'Name', render: (t) => <strong>{t.name}</strong> },
    { key: 'slug', header: 'Slug', className: 'table_cell_mono', render: (t) => t.slug },
    { key: 'description', header: 'Description', render: (t) => t.description || <span className='dk-muted'>—</span> },
    { key: 'posts', header: 'Posts', render: (t) => t.postCount },
    {
      key: 'actions',
      header: '',
      className: 'table_cell_right',
      render: (t) => (
        <div className='table_actions_row'>
          <button type='button' className='table_action_btn' title='Edit' onClick={() => setEditing({ term: t })}>
            <Pencil aria-hidden />
          </button>
          <button type='button' className='table_action_btn table_action_delete' title='Delete' onClick={() => setDeleting(t)}>
            <Trash2 aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className='dashboard_page'>
      <PageHeader
        title={`Blog ${meta.plural.toLowerCase()}`}
        description={kind === 'categories' ? 'Each post belongs to one category. Categories get their own page on the site.' : 'Tags label posts by topic. A post can have many.'}
        actions={
          <button type='button' className='btn_primary' onClick={() => setEditing({})}>
            <Plus size={15} aria-hidden /> Add {meta.singular.toLowerCase()}
          </button>
        }
      >
        <div className='table_search'>
          <input type='search' placeholder={`Search ${meta.plural.toLowerCase()}`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={isLoading}
        error={error ? errorMessage(error) : null}
        emptyMessage={search ? 'Nothing matches your search.' : `No ${meta.plural.toLowerCase()} yet.`}
      />

      {editing && <TermModal kind={kind} term={editing.term} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${meta.singular.toLowerCase()}`}
          message={
            <>
              <strong>{deleting.name}</strong> will be deleted.
              {deleting.postCount > 0 && ` ${deleting.postCount} post(s) use it and will lose this ${meta.singular.toLowerCase()}.`}
            </>
          }
          confirmLabel='Delete'
          danger
          busy={deleteTerm.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function TermModal({ kind, term, onClose }: { kind: TaxonomyKind; term?: BlogTerm; onClose: () => void }) {
  const meta = TAXONOMY_META[kind];
  const saveTerm = useSaveTerm(kind);
  const [name, setName] = useState(term?.name ?? '');
  const [slug, setSlug] = useState(term?.slug ?? '');
  const [description, setDescription] = useState(term?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = async () => {
    const parsed = blogTermInputSchema.safeParse({ name, slug, description });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    try {
      await saveTerm.mutateAsync({ id: term?.id, input: parsed.data });
      toast.success(`${meta.singular} ${term ? 'updated' : 'added'}.`);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal
      title={`${term ? 'Edit' : 'Add'} ${meta.singular.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <button type='button' className='btn_secondary' onClick={onClose}>
            Cancel
          </button>
          <button type='button' className='btn_primary' onClick={submit} disabled={saveTerm.isPending}>
            {saveTerm.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <Field label='Name' htmlFor='term-name' error={errors.name} required>
        <input id='term-name' value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label='Slug' htmlFor='term-slug' error={errors.slug} hint={`Leave empty to use "${slugify(name) || '…'}"`}>
        <input id='term-slug' value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      <Field label='Description' htmlFor='term-description' error={errors.description}>
        <textarea id='term-description' rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
    </Modal>
  );
}
