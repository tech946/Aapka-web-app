'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil, PenSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, PageHeader, Pagination, type Column } from '@/components/dashboard/kit';
import { useAccess } from '@/hooks/use-access';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { PERMISSIONS } from '@/lib/access';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { BLOG_PAGE_SIZE, BLOG_STATUSES, BLOG_STATUS_META, type BlogStatus } from '../constants';
import { useBlogPosts, useBlogTerms, useDeletePost } from '../hooks';
import type { BlogPostSummary } from '../types';
import { BlogStatusBadge } from './BlogStatusBadge';

export function BlogPostsPage() {
  const { can } = useAccess();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BlogStatus | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<BlogPostSummary | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, error } = useBlogPosts({
    search: debouncedSearch,
    status: status || undefined,
    categoryId: categoryId || undefined,
    page,
    pageSize: BLOG_PAGE_SIZE,
  });
  const { data: categories = [] } = useBlogTerms('categories');
  const deletePost = useDeletePost();

  const filterBy = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePost.mutateAsync(deleting.id);
      toast.success('Post deleted.');
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<BlogPostSummary>[] = [
    {
      key: 'title',
      header: 'Post',
      render: (p) => (
        <Link href={`/dashboard/blogs/${p.id}`} className='dk-post-cell'>
          {p.coverImageUrl ? <img src={p.coverImageUrl} alt='' /> : <span className='dk-post-cell__placeholder' />}
          <span className='dk-stack'>
            <strong>{p.title}</strong>
            <span className='dk-muted'>/blogs/{p.slug}</span>
          </span>
        </Link>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <BlogStatusBadge status={p.status} /> },
    { key: 'category', header: 'Category', render: (p) => p.category?.name ?? <span className='dk-muted'>—</span> },
    { key: 'author', header: 'Author', render: (p) => p.authorName ?? <span className='dk-muted'>—</span> },
    { key: 'published', header: 'Published', render: (p) => formatDate(p.publishedAt) },
    { key: 'updated', header: 'Updated', render: (p) => formatDate(p.updatedAt) },
    {
      key: 'actions',
      header: '',
      className: 'table_cell_right',
      render: (p) => (
        <div className='table_actions_row'>
          {p.status === 'published' && (
            <a className='table_action_btn' href={`/blogs/${p.slug}`} target='_blank' rel='noopener noreferrer' title='View on site'>
              <ExternalLink aria-hidden />
            </a>
          )}
          <Link className='table_action_btn' href={`/dashboard/blogs/${p.id}`} title='Edit'>
            <Pencil aria-hidden />
          </Link>
          {can(PERMISSIONS.BLOG_DELETE) && (
            <button type='button' className='table_action_btn table_action_delete' title='Delete' onClick={() => setDeleting(p)}>
              <Trash2 aria-hidden />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='dashboard_page'>
      <PageHeader
        title='Blog posts'
        description='Write, review and publish articles for the website.'
        actions={
          can(PERMISSIONS.BLOG_WRITE) && (
            <Link href='/dashboard/blogs/new' className='btn_primary'>
              <PenSquare size={15} aria-hidden /> Write a post
            </Link>
          )
        }
      >
        <div className='table_search'>
          <input type='search' placeholder='Search by title' value={search} onChange={(e) => filterBy(() => setSearch(e.target.value))} />
        </div>
        <div className='table_actions'>
          <select value={status} onChange={(e) => filterBy(() => setStatus(e.target.value as BlogStatus | ''))}>
            <option value=''>All statuses</option>
            {BLOG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BLOG_STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select value={categoryId} onChange={(e) => filterBy(() => setCategoryId(e.target.value))}>
            <option value=''>All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        error={error ? errorMessage(error) : null}
        emptyMessage={debouncedSearch || status || categoryId ? 'No posts match these filters.' : 'No posts yet. Write the first one.'}
      />

      {data && <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {deleting && (
        <ConfirmDialog
          title='Delete post'
          message={
            <>
              <strong>{deleting.title}</strong> will be deleted permanently
              {deleting.status === 'published' ? ' and removed from the website' : ''}.
            </>
          }
          confirmLabel='Delete'
          danger
          busy={deletePost.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
