'use client';

import '../../blog-editor.css';
import { useEffect, useState, useTransition, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import TipTapEditor from '@/components/ui/TipTapEditor';
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from '@/lib/cloudinary';

type CategoryOption = { id: string; name: string };
type SubCategoryOption = { id: string; name: string; category_id: string };
type TagOption = { id: string; name: string };

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogEditClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState('inactive');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState('');
  const [thumbnailImagePreview, setThumbnailImagePreview] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        const d = json.data;
        if (d) {
          setTitle(d.title || '');
          setSlug(d.slug || '');
          setContent(d.content || '');
          setCategoryId(d.category_id || '');
          setSubCategoryId(d.sub_category_id || '');
          setStatus(d.status || 'inactive');
          const img = d.featured_image || '';
          setThumbnailImageUrl(img);
          setThumbnailImagePreview(img);
          setOriginalImageUrl(img);
          const tids = d.blog_post_tags?.map((t: { tag_id: string }) => t.tag_id) ?? [];
          setTagIds(tids);
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/blog-categories?limit=100'),
          fetch('/api/blog-tags?limit=100'),
        ]);
        const catJson = await catRes.json();
        const tagJson = await tagRes.json();
        setCategories(catJson.data?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) ?? []);
        setTags(tagJson.data?.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) ?? []);
      } catch {
        setCategories([]);
        setTags([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setSlug(toSlug(title) || '');
  }, [title]);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId('');
      return;
    }
    async function load() {
      try {
        const res = await fetch(`/api/blog-sub-categories?category_id=${categoryId}&limit=100`);
        const json = await res.json();
        setSubCategories(json.data ?? []);
        setSubCategoryId((prev) => {
          const exists = json.data?.some((s: { id: string }) => s.id === prev);
          return exists ? prev : '';
        });
      } catch {
        setSubCategories([]);
      }
    }
    load();
  }, [categoryId]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            slug: slug || toSlug(title),
            content,
            category_id: categoryId || null,
            sub_category_id: subCategoryId || null,
            tag_ids: tagIds,
            status,
            featured_image: thumbnailImageUrl || null,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error ?? 'Failed to update');
        }
        toast.success('Blog updated successfully');
        router.push('/dashboard/blog-management/blogs');
      } catch (e: any) {
        toast.error(e?.message || 'Failed to update blog');
      }
    });
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file, 'blogs');
      setThumbnailImageUrl(url);
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload');
      setThumbnailImagePreview(originalImageUrl);
      fileInputRef.current && (fileInputRef.current.value = '');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (thumbnailImageUrl && thumbnailImageUrl !== originalImageUrl) {
      try {
        await deleteImageFromCloudinary(thumbnailImageUrl);
      } catch (e) {
        console.error(e);
      }
    }
    setThumbnailImageUrl('');
    setThumbnailImagePreview('');
    fileInputRef.current && (fileInputRef.current.value = '');
  };

  if (loading) {
    return (
      <div className="dashboard_page">
        <div className="heading_block">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <h3>Edit Blog</h3>
        <p>Edit blog post</p>
      </div>

      <div className="blog-form" style={{ padding: 24, maxWidth: 900 }}>
        <div className="form_row">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Blog title"
            style={{ width: '100%', padding: '10px 12px' }}
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
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              cursor: 'not-allowed',
            }}
          />
        </div>

        <div className="form_row">
          <label>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px' }}
          >
            <option value="">Select category (optional)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form_row">
          <label>Sub Category (optional)</label>
          <select
            value={subCategoryId}
            onChange={(e) => setSubCategoryId(e.target.value)}
            disabled={!categoryId}
            style={{
              width: '100%',
              padding: '10px 12px',
              opacity: categoryId ? 1 : 0.6,
            }}
          >
            <option value="">Select sub-category (optional)</option>
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form_row full_width">
          <label>Thumbnail Image</label>
          <div
            className="blog-thumbnail-upload"
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
              backgroundColor: 'var(--panel-2)',
              cursor: isUploadingImage ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isUploadingImage ? 0.6 : 1,
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploadingImage) e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border)';
              if (isUploadingImage) return;
              const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'));
              if (!file) return;
              const fake = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
              await handleImageUpload(fake);
            }}
            onClick={() => !isUploadingImage && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploadingImage}
              style={{ display: 'none' }}
            />
            {isUploadingImage ? (
              <div>
                <div className="upload-spinner" style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Uploading...</p>
              </div>
            ) : (
              <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ color: 'var(--text)', margin: '0 0 4px', fontSize: 14, fontWeight: 500 }}>Click or drag to upload thumbnail</p>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 12 }}>Max 5MB. Change image to replace.</p>
              </div>
            )}
          </div>
          {thumbnailImagePreview && (
            <div style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
              <img
                src={thumbnailImagePreview}
                alt="Thumbnail preview"
                style={{ maxWidth: 200, maxHeight: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn_remove_image"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="form_row">
          <label>Tags (multiple)</label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              minHeight: 44,
            }}
          >
            {tags.map((t) => (
              <label
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 4,
                  backgroundColor: tagIds.includes(t.id) ? '#ff4c00' : '#f3f4f6',
                  color: tagIds.includes(t.id) ? '#fff' : '#374151',
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                  style={{ margin: 0 }}
                />
                {t.name}
              </label>
            ))}
            {tags.length === 0 && (
              <span style={{ color: '#6b7280', fontSize: 14 }}>
                No tags. Add tags in Tags section first.
              </span>
            )}
          </div>
        </div>

        <div className="form_row full_width">
          <label>Content</label>
          <div className="blog-editor-wrapper">
            <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your blog content here..."
            height={400}
          />
          </div>
        </div>

        <div className="form_row">
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '10px 12px' }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
          <button
            className="btn_primary"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
          >
            {isPending ? 'Saving...' : 'Update Blog'}
          </button>
          <Link href="/dashboard/blog-management/blogs" className="btn_secondary">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
