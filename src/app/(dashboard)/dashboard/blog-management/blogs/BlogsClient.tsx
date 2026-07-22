'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured_image?: string | null;
  category_id?: string | null;
  sub_category_id?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  blog_categories?: { name: string } | null;
  blog_sub_categories?: { name: string } | null;
  blog_post_tags?: Array<{ blog_tags?: { name: string } | null }> | null;
};

export default function BlogsClient() {
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
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
        if (statusFilter) params.append('status', statusFilter);
        const res = await fetch(`/api/blogs?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load blogs');
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
  }, [page, limit, query, statusFilter, reloadKey]);

  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  const getCategoryName = (row: BlogPost) => {
    const cat = row.blog_categories;
    if (cat && typeof cat === 'object' && 'name' in cat) return (cat as { name: string }).name;
    return '-';
  };

  const getSubCategoryName = (row: BlogPost) => {
    const sub = row.blog_sub_categories;
    if (sub && typeof sub === 'object' && 'name' in sub) return (sub as { name: string }).name;
    return '-';
  };

  const getTagNames = (row: BlogPost) => {
    const tags = row.blog_post_tags;
    if (!Array.isArray(tags)) return '-';
    return tags
      .map((t) => (t.blog_tags && typeof t.blog_tags === 'object' && 'name' in t.blog_tags ? (t.blog_tags as { name: string }).name : null))
      .filter(Boolean)
      .join(', ') || '-';
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete blog "${title}"?`)) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to delete');
      }
      toast.success('Blog deleted');
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete blog');
    }
  };

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';
    const label = status === 'active' ? 'Active' : 'Inactive';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Blogs</h3>
        <p>Manage blog posts</p>
      </div>

      <div className="table_toolbar">
        <div className="table_search" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search blogs..."
            value={pendingQuery}
            onChange={(e) => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--panel-2)',
              color: 'var(--text)',
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="table_actions">
          <Link href="/dashboard/blog-management/blogs/add" className="btn_primary">
            Add Blog
          </Link>
        </div>
      </div>

      <div className="table_wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Category</th>
              <th>Sub Category</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="table_loading">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="table_empty">
                  No blogs found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.featured_image ? (
                      <img
                        src={r.featured_image}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>{r.title}</td>
                  <td>{getCategoryName(r)}</td>
                  <td>{getSubCategoryName(r)}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getTagNames(r)}
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/blog-management/blogs/${r.id}/edit`}
                      className="table_action_btn"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(r.id, r.title)}
                      className="table_action_btn table_action_delete"
                    >
                      Delete
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
    </div>
  );
}
