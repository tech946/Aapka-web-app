'use client';

import { useEffect, useMemo, useState } from 'react';
import EditPackageClient from './EditPackageClient';
import { toast } from 'sonner';
import { AlertCircle, X, Trash2 } from 'lucide-react';

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
  infant_price?: number | null;
  child_amount?: number | null;
  infant_amount?: number | null;
  status?: string | null;
  created_at: string | null;
};

export default function CategoryPackagesClient({
  categoryId,
  categorySlug,
  categoryName,
}: {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
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
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    packageId: string;
    packageName: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    packageId: string;
    packageName: string;
  } | null>(null);
  const [deletePackageName, setDeletePackageName] = useState('');
  const [deletingPackage, setDeletingPackage] = useState<Set<string>>(
    new Set()
  );

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
          status: 'all', // Dashboard can see all packages (active and inactive)
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
        console.log(
          'Packages loaded:',
          json.data?.length,
          'total:',
          json.total
        );
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

  const handleStatusToggleClick = (
    packageId: string,
    currentStatus: string,
    packageName: string
  ) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setConfirmModal({
      isOpen: true,
      packageId,
      packageName,
      currentStatus,
      newStatus,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmModal) return;

    const { packageId, newStatus } = confirmModal;
    setUpdatingStatus(prev => new Set(prev).add(packageId));

    try {
      const response = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: packageId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error ?? 'Failed to update status');
      }

      // Update local state
      setRows(prev =>
        prev.map(pkg =>
          pkg.package_id === packageId ? { ...pkg, status: newStatus } : pkg
        )
      );

      toast.success(
        `Package ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      );
      setConfirmModal(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  const handleCancelStatusChange = () => {
    setConfirmModal(null);
  };

  const handleDeleteClick = (packageId: string, packageName: string) => {
    setDeleteModal({
      isOpen: true,
      packageId,
      packageName,
    });
    setDeletePackageName('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;

    const { packageId, packageName } = deleteModal;

    // Validate that entered name matches exactly
    if (deletePackageName.trim() !== packageName.trim()) {
      toast.error(
        'Package name does not match. Please enter the exact package name.'
      );
      return;
    }

    setDeletingPackage(prev => new Set(prev).add(packageId));

    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error ?? 'Failed to delete package');
      }

      // Remove from local state
      setRows(prev => prev.filter(pkg => pkg.package_id !== packageId));
      setTotal(prev => Math.max(0, prev - 1));

      toast.success('Package deleted successfully');
      setDeleteModal(null);
      setDeletePackageName('');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete package'
      );
    } finally {
      setDeletingPackage(prev => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(null);
    setDeletePackageName('');
  };

  return (
    <>
      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee',
            color: '#c00',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          Error: {error}
        </div>
      )}
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
              <th>Infant</th>
              <th>Child Amt</th>
              <th>Infant Amt</th>
              <th>Status</th>
              <th>Description</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={13} className='table_loading'>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={13} className='table_empty'>
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
                  <td>{p.infant_price ?? '-'}</td>
                  <td>{p.child_amount ?? '-'}</td>
                  <td>{p.infant_amount ?? '-'}</td>
                  <td>
                    <div
                      className='status_toggle_wrapper'
                      onClick={() =>
                        !updatingStatus.has(p.package_id) &&
                        handleStatusToggleClick(
                          p.package_id,
                          p.status || 'inactive',
                          p.package_name
                        )
                      }
                    >
                      <input
                        type='checkbox'
                        checked={p.status === 'active'}
                        readOnly
                        disabled={updatingStatus.has(p.package_id)}
                        className='status_toggle'
                      />
                      <span className='status_toggle_label'>
                        {p.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className='truncate'>{p.package_description}</td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <EditPackageClient
                        pkg={p}
                        categoryId={categoryId}
                        categorySlug={categorySlug}
                        categoryName={categoryName}
                      />
                      <button
                        className='btn_secondary btn_small btn_danger'
                        onClick={() =>
                          handleDeleteClick(p.package_id, p.package_name)
                        }
                        disabled={deletingPackage.has(p.package_id)}
                        title='Delete package'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className='modal_overlay' onClick={handleCancelStatusChange}>
          <div
            className='modal status_confirm_modal'
            onClick={e => e.stopPropagation()}
          >
            <div className='modal_header'>
              <h4>Confirm Status Change</h4>
              <button
                className='modal_close'
                onClick={handleCancelStatusChange}
              >
                <X size={20} />
              </button>
            </div>
            <div className='modal_body'>
              <div className='status_confirm_content'>
                <div className='status_confirm_icon'>
                  <AlertCircle size={48} />
                </div>
                <h3>Are you sure?</h3>
                <p>
                  Do you want to{' '}
                  <strong>
                    {confirmModal.newStatus === 'active'
                      ? 'activate'
                      : 'deactivate'}
                  </strong>{' '}
                  the package <strong>"{confirmModal.packageName}"</strong>?
                </p>
                <div className='status_confirm_info'>
                  <span>
                    Current Status:{' '}
                    <strong>
                      {confirmModal.currentStatus === 'active'
                        ? 'Active'
                        : 'Inactive'}
                    </strong>
                  </span>
                  <span>→</span>
                  <span>
                    New Status:{' '}
                    <strong>
                      {confirmModal.newStatus === 'active'
                        ? 'Active'
                        : 'Inactive'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <div className='modal_footer'>
              <button
                onClick={handleCancelStatusChange}
                disabled={updatingStatus.has(confirmModal.packageId)}
                className='btn_secondary'
              >
                Cancel
              </button>
              <button
                className='btn_primary'
                onClick={handleConfirmStatusChange}
                disabled={updatingStatus.has(confirmModal.packageId)}
              >
                {updatingStatus.has(confirmModal.packageId)
                  ? 'Updating...'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className='modal_overlay' onClick={handleCancelDelete}>
          <div
            className='modal status_confirm_modal'
            onClick={e => e.stopPropagation()}
          >
            <div className='modal_header'>
              <h4>Delete Package</h4>
              <button className='modal_close' onClick={handleCancelDelete}>
                <X size={20} />
              </button>
            </div>
            <div className='modal_body'>
              <div className='status_confirm_content'>
                <div
                  className='status_confirm_icon'
                  style={{ color: '#dc2626' }}
                >
                  <AlertCircle size={48} />
                </div>
                <h3>Are you sure?</h3>
                <p>
                  This action cannot be undone. This will permanently delete the
                  package <strong>"{deleteModal.packageName}"</strong>.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--text)',
                    }}
                  >
                    To delete, please enter the package name:{' '}
                    <strong>{deleteModal.packageName}</strong>
                  </label>
                  <input
                    type='text'
                    value={deletePackageName}
                    onChange={e => setDeletePackageName(e.target.value)}
                    placeholder='Enter package name'
                    disabled={deletingPackage.has(deleteModal.packageId)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      background: 'var(--panel-2)',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                    onKeyDown={e => {
                      if (
                        e.key === 'Enter' &&
                        deletePackageName.trim() ===
                          deleteModal.packageName.trim()
                      ) {
                        handleConfirmDelete();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='modal_footer'>
              <button
                onClick={handleCancelDelete}
                disabled={deletingPackage.has(deleteModal.packageId)}
                className='btn_secondary'
              >
                Cancel
              </button>
              <button
                className='btn_primary btn_danger'
                onClick={handleConfirmDelete}
                disabled={
                  deletingPackage.has(deleteModal.packageId) ||
                  deletePackageName.trim() !== deleteModal.packageName.trim()
                }
              >
                {deletingPackage.has(deleteModal.packageId)
                  ? 'Deleting...'
                  : 'Delete Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
