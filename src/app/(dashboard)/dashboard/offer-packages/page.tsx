'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type PackageRow = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  status?: string | null;
  created_at?: string | null;
};

export default function OfferPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
        const res = await fetch(`/api/packages?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Failed to load packages');
        }
        const json = await res.json();
        if (!active) return;
        setPackages(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch (e: any) {
        if (!active) return;
        if (e.name !== 'AbortError') {
          setError(e?.message ?? 'Error');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, limit, query]);

  // Debounced search typing
  const [pendingQuery, setPendingQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(pendingQuery), 350);
    return () => clearTimeout(t);
  }, [pendingQuery]);

  const onAddPackage = async (form: {
    name: string;
    description?: string;
    price?: number;
    status?: string;
  }) => {
    try {
      setLoading(true);
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to add package');
      }
      setModalOpen(false);
      // Reload first page to show the new record
      setPage(1);
      setPendingQuery('');
    } catch (e: any) {
      alert(e?.message ?? 'Failed to add package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Offer Packages</h3>
        <p>Manage and create promotional packages</p>
      </div>

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
        <div className='table_actions'>
          <button className='btn_primary' onClick={() => setModalOpen(true)}>
            Add Package
          </button>
        </div>
      </div>

      <div className='table_wrapper'>
        <table className='table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && packages.length === 0 && (
              <tr>
                <td colSpan={5} className='table_empty'>
                  No packages found
                </td>
              </tr>
            )}
            {!loading &&
              packages.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className='truncate'>{p.description}</td>
                  <td>{p.price ?? '-'}</td>
                  <td>{p.status ?? '-'}</td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : '-'}
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
        <AddPackageModal
          onClose={() => setModalOpen(false)}
          onSubmit={onAddPackage}
        />
      )}
    </div>
  );
}

function AddPackageModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: {
    name: string;
    description?: string;
    price?: number;
    status?: string;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [status, setStatus] = useState('active');

  const modalContent = (
    <div className='modal_overlay' onClick={onClose}>
      <div className='modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Add Package</h4>
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
              placeholder='Package name'
            />
          </div>
          <div className='form_row'>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Short description'
            />
          </div>
          <div className='form_row'>
            <label>Price</label>
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder='e.g. 499'
            />
          </div>
          <div className='form_row'>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value='active'>active</option>
              <option value='inactive'>inactive</option>
            </select>
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={onClose}>Cancel</button>
          <button
            className='btn_primary'
            onClick={() =>
              onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                price: price ? Number(price) : undefined,
                status,
              })
            }
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
