'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  blog_categories?: { name: string } | null;
  created_at?: string | null;
};

type CategoryOption = { id: string; name: string };

export default function BlogSubCategoriesClient() {
  const [rows, setRows] = useState<SubCategoryRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubCategoryRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/blog-categories?limit=100');
        const json = await res.json();
        if (!active) return;
        setCategories(json.data?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) ?? []);
      } catch {
        if (active) setCategories([]);
      }
    }
    load();
    return () => { active = false; };
  }, []);

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
        if (filterCategoryId) params.append('category_id', filterCategoryId);
        const res = await fetch(`/api/blog-sub-categories?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load sub-categories');
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
  }, [page, limit, query, filterCategoryId, reloadKey]);

  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  const getCategoryName = (row: SubCategoryRow) => {
    if (row.blog_categories && typeof row.blog_categories === 'object' && 'name' in row.blog_categories) {
      return (row.blog_categories as { name: string }).name;
    }
    const cat = categories.find((c) => c.id === row.category_id);
    return cat?.name ?? '-';
  };

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Blog Sub Categories</h3>
        <p>Manage sub-categories (dependent on category)</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search">
          <input
            type="text"
            placeholder="Search sub-categories..."
            value={pendingQuery}
            onChange={(e) => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
        </div>
        <div className="table_actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={filterCategoryId}
            onChange={(e) => {
              setPage(1);
              setFilterCategoryId(e.target.value);
            }}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e7eb' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn_primary" onClick={() => setModalOpen(true)}>
            Add Sub Category
          </button>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Category</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="table_loading">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="table_empty">No sub-categories found</td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.slug}</td>
                  <td>{getCategoryName(r)}</td>
                  <td>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                  </td>
                  <td>
                    <button
                      className="table_action_btn"
                      onClick={() => {
                        setEditingItem(r);
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
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>

      {modalOpen && (
        <SubCategoryModal
          categories={categories}
          onClose={() => setModalOpen(false)}
          submitting={isPending}
          onSubmit={(categoryId, name, description) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-sub-categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ category_id: categoryId, name, description }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to add');
                }
                toast.success('Sub-category added successfully');
                setModalOpen(false);
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to add sub-category');
              }
            });
          }}
        />
      )}
      {editModalOpen && editingItem && (
        <SubCategoryModal
          categories={categories}
          item={editingItem}
          onClose={() => {
            setEditModalOpen(false);
            setEditingItem(null);
          }}
          submitting={isPending}
          onSubmit={(categoryId, name, description) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-sub-categories', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingItem.id,
                    category_id: categoryId,
                    name,
                    description,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to update');
                }
                toast.success('Sub-category updated successfully');
                setEditModalOpen(false);
                setEditingItem(null);
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to update sub-category');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function SubCategoryModal({
  categories,
  item,
  onClose,
  onSubmit,
  submitting,
}: {
  categories: CategoryOption[];
  item?: SubCategoryRow;
  onClose: () => void;
  onSubmit: (categoryId: string, name: string, description: string | null) => void;
  submitting: boolean;
}) {
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');

  useEffect(() => {
    if (item) {
      setCategoryId(item.category_id || '');
      setName(item.name || '');
      setDescription(item.description || '');
    }
  }, [item]);

  const handleSubmit = () => {
    onSubmit(categoryId, name.trim(), description.trim() || null);
  };

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h4>{item ? 'Edit' : 'Add'} Sub Category</h4>
          <button className="modal_close" onClick={onClose}>×</button>
        </div>
        <div className="modal_body">
          <div className="form_row">
            <label>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form_row">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sub-category name"
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
          <button className="btn_secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn_primary"
            onClick={handleSubmit}
            disabled={!categoryId || !name.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
