'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

type TagRow = {
  id: string;
  name: string;
  slug: string;
  created_at?: string | null;
};

export default function BlogTagsClient() {
  const [rows, setRows] = useState<TagRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
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
        const res = await fetch(`/api/blog-tags?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load tags');
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
        <h3>Blog Tags</h3>
        <p>Manage blog tags</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search">
          <input
            type="text"
            placeholder="Search tags..."
            value={pendingQuery}
            onChange={(e) => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
        </div>
        <div className="table_actions">
          <button className="btn_primary" onClick={() => setModalOpen(true)}>
            Add Tag
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
                  No tags found
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
                        setEditingTag(r);
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
        <TagModal
          onClose={() => setModalOpen(false)}
          submitting={isPending}
          onSubmit={(name) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-tags', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to add');
                }
                toast.success('Tag added successfully');
                setModalOpen(false);
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to add tag');
              }
            });
          }}
        />
      )}
      {editModalOpen && editingTag && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setEditModalOpen(false);
            setEditingTag(null);
          }}
          submitting={isPending}
          onSubmit={(name) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/blog-tags', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: editingTag.id, name }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to update');
                }
                toast.success('Tag updated successfully');
                setEditModalOpen(false);
                setEditingTag(null);
                setReloadKey((k) => k + 1);
              } catch (e: any) {
                toast.error(e?.message || 'Failed to update tag');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function TagModal({
  tag,
  onClose,
  onSubmit,
  submitting,
}: {
  tag?: TagRow;
  onClose: () => void;
  onSubmit: (name: string) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(tag?.name || '');

  useEffect(() => {
    if (tag) setName(tag.name || '');
  }, [tag]);

  const handleSubmit = () => {
    onSubmit(name.trim());
  };

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h4>{tag ? 'Edit' : 'Add'} Tag</h4>
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
              placeholder="Tag name"
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
