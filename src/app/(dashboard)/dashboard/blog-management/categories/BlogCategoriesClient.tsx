'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at?: string | null;
};

export default function BlogCategoriesClient() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
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
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          q: query,
        });
        const res = await fetch(`/api/blog-categories?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load categories');
        const json = await res.json();
        if (!active) return;
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (e: any) {
        if (!active) return;
        if (e.name !== 'AbortError') toast.error(e?.message ?? 'Error');
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

  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Blog Categories</h3>
        <p>Manage blog categories</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search">
          <input
            type="text"
            placeholder="Search categories..."
            value={pendingQuery}
            onChange={(e) => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
        </div>
        <div className="table_actions">
          <button className="btn_primary" onClick={() => setModalOpen(true)}>
            Add Category
          </button>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="table_loading">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="table_empty">
                  No categories found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.slug}</td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="table_action_btn"
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

      <div className="table_pagination">
        <div className="pagination_info">
          Page {page} of {totalPages} • {total} total
        </div>
        <div className="pagination_controls">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <select
            value={limit}
            onChange={(e) => {
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
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen && (
        <CategoryModal
          onClose={() => setModalOpen(false)}
          submitting={isPending}
          onSubmit={(name, description) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, description }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to add');
                }
                toast.success('Category added successfully');
                setModalOpen(false);
                setPage(1);
                setPendingQuery('');
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to add category');
              }
            });
          }}
        />
      )}
      {editModalOpen && editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setEditModalOpen(false);
            setEditingCategory(null);
          }}
          submitting={isPending}
          onSubmit={(name, description) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-categories', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingCategory.id,
                    name,
                    description,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to update');
                }
                toast.success('Category updated successfully');
                setEditModalOpen(false);
                setEditingCategory(null);
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to update category');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function CategoryModal({
  category,
  onClose,
  onSubmit,
  submitting,
}: {
  category?: CategoryRow;
  onClose: () => void;
  onSubmit: (name: string, description: string | null) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const slug = toSlug(name) || (category?.slug || '');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
    }
  }, [category]);

  const handleSubmit = () => {
    onSubmit(name.trim(), description.trim() || null);
  };

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h4>{category ? 'Edit' : 'Add'} Category</h4>
          <button className="modal_close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal_body">
          <div className="form_row">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
            />
          </div>
          <div className="form_row">
            <label>Slug (auto-generated)</label>
            <input
              value={slug}
              disabled
              readOnly
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--panel-2)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed',
                opacity: 0.9,
              }}
            />
          </div>
          <div className="form_row full_width">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
        <div className="modal_footer">
          <button className="btn_secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn_primary"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
