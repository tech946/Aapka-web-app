'use client';

import { useEffect, useMemo, useState } from 'react';
import EditPackageClient from './EditPackageClient';

type Pkg = {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  travel_date?: string | null;
  adult_price?: number | null;
  child_price?: number | null;
  created_at: string | null;
};

export default function CategoryPackagesClient({
  categoryId,
}: {
  categoryId: string;
}) {
  const [rows, setRows] = useState<Pkg[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState('');

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  // listen to add/edit events to refetch
  useEffect(() => {
    const onChanged = () => setReloadKey(k => k + 1);
    window.addEventListener('packages:changed', onChanged);
    return () => window.removeEventListener('packages:changed', onChanged);
  }, []);

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
          category_id: categoryId,
        });
        const res = await fetch(`/api/packages?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error ?? 'Failed to load packages');
        }
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
  }, [page, limit, query, categoryId, reloadKey]);

  return (
    <>
      <div className='table_toolbar'>
        <div className='table_search'>
          <input
            type='text'
            placeholder='Search packages...'
            value={pendingQuery}
            onChange={e => {
              setPage(1);
              setPendingQuery(e.target.value);
            }}
          />
        </div>
        <div className='table_actions'></div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Days/Nights</th>
              <th>Travel</th>
              <th>Adult</th>
              <th>Child</th>
              <th>Description</th>
              <th>Created</th>
              <th></th>
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
                  No packages found
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(p => (
                <tr key={p.package_id}>
                  <td>{p.package_name}</td>
                  <td>{p.package_price ?? '-'}</td>
                  <td>
                    {p.package_days ?? '-'} / {p.package_nights ?? '-'}
                  </td>
                  <td>
                    {p.travel_date
                      ? new Date(p.travel_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{p.adult_price ?? '-'}</td>
                  <td>{p.child_price ?? '-'}</td>
                  <td className='truncate'>{p.package_description}</td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <EditPackageClient pkg={p} categoryId={categoryId} />
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
    </>
  );
}
