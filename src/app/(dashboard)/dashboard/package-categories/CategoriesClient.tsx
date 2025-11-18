'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type CategoryRow = {
  id: string;
  name: string;
  packagetypename?: string | null;
  packagetypeid?: number | null;
  created_at?: string | null;
};

export default function CategoriesClient() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          q: query,
        });
        const res = await fetch(
          `/api/package-categories?${params.toString()}`,
          {
            method: 'GET',
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error('Failed to load categories');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (e: any) {
        if (!active) return;
        if (e.name !== 'AbortError') setError(e?.message ?? 'Error');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, limit, query, reloadKey]);

  // Debounced search typing
  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Package Master</h3>
        <p>Create and manage package categories</p>
      </div>

      <div className='table_toolbar'>
        <div className='table_search'>
          <input
            type='text'
            placeholder='Search categories...'
            value={pendingQuery}
            onChange={e => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
        </div>
        <div className='table_actions'>
          <button className='btn_primary' onClick={() => setModalOpen(true)}>
            Add Category
          </button>
        </div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className='table_empty'>
                  No categories found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.packagetypename || '-'}</td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingCategory(r);
                        setEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className='table_pagination'>
        <div className='pagination_info'>
          Page {page} of {totalPages} • {total} total
        </div>
        <div className='pagination_controls'>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <select
            value={limit}
            onChange={e => {
              setPage(1);
              setLimit(parseInt(e.target.value, 10));
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen && (
        <AddCategoryModal
          onClose={() => setModalOpen(false)}
          submitting={isPending}
          onSubmit={(name, packagetypeid, packagetypename) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/package-categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    packagetypeid,
                    packagetypename,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to add');
                }
              } catch (e) {
                console.error(e);
              }
              setModalOpen(false);
              // Reset to first page and clear search; GET data will refetch
              setPage(1);
              setPendingQuery('');
              setReloadKey(k => k + 1);
            });
          }}
        />
      )}
      {editModalOpen && editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => {
            setEditModalOpen(false);
            setEditingCategory(null);
          }}
          submitting={isPending}
          onSubmit={(name, packagetypeid, packagetypename) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/package-categories', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingCategory.id,
                    name,
                    packagetypeid,
                    packagetypename,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to update');
                }
              } catch (e) {
                console.error(e);
              }
              setEditModalOpen(false);
              setEditingCategory(null);
              // Reset to first page and clear search; GET data will refetch
              setPage(1);
              setPendingQuery('');
              setReloadKey(k => k + 1);
            });
          }}
        />
      )}
    </div>
  );
}

function AddCategoryModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (
    name: string,
    packagetypeid: number,
    packagetypename: string
  ) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');

  const typeOptions = [
    { id: 1, name: 'package' },
    { id: 2, name: 'tour' },
  ];

  const handleSubmit = () => {
    const selectedType = typeOptions.find(t => String(t.id) === type);
    if (selectedType) {
      onSubmit(name.trim(), selectedType.id, selectedType.name);
    }
  };

  return (
    <div className='modal_overlay' onClick={onClose}>
      <div className='modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Add Category</h4>
          <button className='modal_close' onClick={onClose}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          <div className='form_row'>
            <label>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Category name'
            />
          </div>
          <div className='form_row'>
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value=''>Select type</option>
              {typeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className='btn_primary'
            onClick={handleSubmit}
            disabled={!name.trim() || !type || submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCategoryModal({
  category,
  onClose,
  onSubmit,
  submitting,
}: {
  category: CategoryRow;
  onClose: () => void;
  onSubmit: (
    name: string,
    packagetypeid: number,
    packagetypename: string
  ) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(category.name || '');
  const [type, setType] = useState<string>(
    category.packagetypeid ? String(category.packagetypeid) : ''
  );

  // Update form when category changes
  useEffect(() => {
    setName(category.name || '');
    setType(category.packagetypeid ? String(category.packagetypeid) : '');
  }, [category]);

  const typeOptions = [
    { id: 1, name: 'package' },
    { id: 2, name: 'tour' },
  ];

  const handleSubmit = () => {
    const selectedType = typeOptions.find(t => String(t.id) === type);
    if (selectedType) {
      onSubmit(name.trim(), selectedType.id, selectedType.name);
    }
  };

  return (
    <div className='modal_overlay' onClick={onClose}>
      <div className='modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Edit Category</h4>
          <button className='modal_close' onClick={onClose}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          <div className='form_row'>
            <label>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Category name'
            />
          </div>
          <div className='form_row'>
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value=''>Select type</option>
              {typeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className='btn_primary'
            onClick={handleSubmit}
            disabled={!name.trim() || !type || submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
