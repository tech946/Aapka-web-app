'use client';

import { useEffect, useMemo, useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from '@/lib/supabase-storage';

type CategoryRow = {
  id: string;
  name: string;
  packagetypename?: string | null;
  packagetypeid?: number | null;
  image?: string | null;
  description?: string | null;
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
          onSubmit={(name, packagetypeid, packagetypename, image, description) => {
            startTransition(async () => {
              try {
                const res = await fetch('/api/package-categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    packagetypeid,
                    packagetypename,
                    image,
                    description,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to add');
                }
                toast.success('Category added successfully');
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || 'Failed to add category');
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
          onSubmit={(name, packagetypeid, packagetypename, image, description) => {
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
                    image,
                    description,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  throw new Error(j?.error ?? 'Failed to update');
                }
                toast.success('Category updated successfully');
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || 'Failed to update category');
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
    packagetypename: string,
    image: string | null,
    description: string | null
  ) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailImagePreview, setThumbnailImagePreview] = useState<string>('');
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeOptions = [
    { id: 1, name: 'package' },
    { id: 2, name: 'tour' },
  ];

  const handleSubmit = async () => {
    const selectedType = typeOptions.find(t => String(t.id) === type);
    if (selectedType) {
      onSubmit(name.trim(), selectedType.id, selectedType.name, thumbnailImageUrl || null, description.trim() || null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setThumbnailImage(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToSupabase(file, 'categories');
      // Delete previous image from storage when replacing (scalability)
      if (thumbnailImageUrl) {
        try {
          await deleteImageFromSupabase(thumbnailImageUrl);
        } catch (e) {
          console.error(e);
        }
      }
      setThumbnailImageUrl(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload image'
      );
      setThumbnailImage(null);
      setThumbnailImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingImage(false);
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
          <div className='form_row full_width'>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Enter category description (optional)'
              rows={4}
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
          <div className='form_row full_width'>
            <label>Category Image</label>
            <div
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isUploadingImage ? 0.6 : 1,
              }}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                if (!isUploadingImage) {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.backgroundColor = '#fff7ed';
                }
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onDrop={async e => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
                if (isUploadingImage) return;
                const file = Array.from(e.dataTransfer.files || []).find(
                  file => file.type.startsWith('image/')
                );
                if (!file) return;
                const fakeEvent = {
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                await handleImageUpload(fakeEvent);
              }}
              onClick={() => {
                if (!isUploadingImage) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                style={{ display: 'none' }}
              />
              {isUploadingImage ? (
                <div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid #f3f4f6',
                      borderTop: '3px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px',
                    }}
                  />
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                    Uploading image...
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    width='48'
                    height='48'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#9ca3af'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{ margin: '0 auto 12px', display: 'block' }}
                  >
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='17 8 12 3 7 8' />
                    <line x1='12' y1='3' x2='12' y2='15' />
                  </svg>
                  <p style={{ color: '#374151', margin: '0 0 4px', fontSize: '14px', fontWeight: '500' }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>
                    Single image (Max 5MB)
                  </p>
                </div>
              )}
            </div>
            {thumbnailImagePreview && thumbnailImagePreview.trim() && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    aspectRatio: '1',
                  }}
                >
                  <img
                    src={thumbnailImagePreview}
                    alt='Category preview'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <button
                    type='button'
                    onClick={async e => {
                      e.stopPropagation();
                      const imageToRemove = thumbnailImageUrl;
                      setThumbnailImage(null);
                      setThumbnailImagePreview('');
                      setThumbnailImageUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (imageToRemove) {
                        try {
                          await deleteImageFromSupabase(imageToRemove);
                          toast.success('Image removed');
                        } catch (error) {
                          console.error('Error deleting image:', error);
                          toast.error('Failed to delete image from storage');
                        }
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <line x1='18' y1='6' x2='6' y2='18' />
                      <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
    packagetypename: string,
    image: string | null,
    description: string | null
  ) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(category.name || '');
  const [type, setType] = useState<string>(
    category.packagetypeid ? String(category.packagetypeid) : ''
  );
  const [description, setDescription] = useState<string>(category.description || '');
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailImagePreview, setThumbnailImagePreview] = useState<string>(
    category.image || ''
  );
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>(
    category.image || ''
  );
  const [originalImageUrl, setOriginalImageUrl] = useState<string>(
    category.image || ''
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form when category changes
  useEffect(() => {
    setName(category.name || '');
    setType(category.packagetypeid ? String(category.packagetypeid) : '');
    setDescription(category.description || '');
    const imageUrl = category.image || '';
    setThumbnailImagePreview(imageUrl);
    setThumbnailImageUrl(imageUrl);
    setOriginalImageUrl(imageUrl);
  }, [category]);

  const typeOptions = [
    { id: 1, name: 'package' },
    { id: 2, name: 'tour' },
  ];

  const handleSubmit = async () => {
    const selectedType = typeOptions.find(t => String(t.id) === type);
    if (selectedType) {
      // Delete old image if it was changed
      if (originalImageUrl && thumbnailImageUrl !== originalImageUrl && originalImageUrl) {
        try {
          await deleteImageFromSupabase(originalImageUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      onSubmit(name.trim(), selectedType.id, selectedType.name, thumbnailImageUrl || null, description.trim() || null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setThumbnailImage(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToSupabase(file, 'categories');
      // Delete previous image from storage when replacing (scalability)
      if (thumbnailImageUrl) {
        try {
          await deleteImageFromSupabase(thumbnailImageUrl);
        } catch (e) {
          console.error(e);
        }
      }
      setThumbnailImageUrl(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload image'
      );
      setThumbnailImage(null);
      setThumbnailImagePreview(originalImageUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingImage(false);
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
          <div className='form_row full_width'>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Enter category description (optional)'
              rows={4}
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
          <div className='form_row full_width'>
            <label>Category Image</label>
            <div
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isUploadingImage ? 0.6 : 1,
              }}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                if (!isUploadingImage) {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.backgroundColor = '#fff7ed';
                }
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onDrop={async e => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = '#f9fafb';
                if (isUploadingImage) return;
                const file = Array.from(e.dataTransfer.files || []).find(
                  file => file.type.startsWith('image/')
                );
                if (!file) return;
                const fakeEvent = {
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                await handleImageUpload(fakeEvent);
              }}
              onClick={() => {
                if (!isUploadingImage) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                style={{ display: 'none' }}
              />
              {isUploadingImage ? (
                <div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid #f3f4f6',
                      borderTop: '3px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px',
                    }}
                  />
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                    Uploading image...
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    width='48'
                    height='48'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#9ca3af'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{ margin: '0 auto 12px', display: 'block' }}
                  >
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='17 8 12 3 7 8' />
                    <line x1='12' y1='3' x2='12' y2='15' />
                  </svg>
                  <p style={{ color: '#374151', margin: '0 0 4px', fontSize: '14px', fontWeight: '500' }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>
                    Single image (Max 5MB)
                  </p>
                </div>
              )}
            </div>
            {thumbnailImagePreview && thumbnailImagePreview.trim() && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    aspectRatio: '1',
                  }}
                >
                  <img
                    src={thumbnailImagePreview}
                    alt='Category preview'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <button
                    type='button'
                    onClick={async e => {
                      e.stopPropagation();
                      const imageToRemove = thumbnailImageUrl;
                      setThumbnailImage(null);
                      setThumbnailImagePreview(originalImageUrl);
                      setThumbnailImageUrl(originalImageUrl);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (imageToRemove && imageToRemove !== originalImageUrl) {
                        try {
                          await deleteImageFromSupabase(imageToRemove);
                          toast.success('Image removed');
                        } catch (error) {
                          console.error('Error deleting image:', error);
                          toast.error('Failed to delete image from storage');
                        }
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <line x1='18' y1='6' x2='6' y2='18' />
                      <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
