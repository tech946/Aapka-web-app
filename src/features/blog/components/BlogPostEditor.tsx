'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Field, ImageField } from '@/components/dashboard/kit';
import { RichTextEditor } from '@/components/dashboard/rich-text/RichTextEditor';
import { useAccess } from '@/hooks/use-access';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import { PERMISSIONS } from '@/lib/access';
import { errorMessage } from '@/lib/api/client';
import { fieldErrors, type FieldErrors } from '@/lib/forms';
import { formatDateTime } from '@/lib/format';
import { slugify } from '@/lib/slug';
import { BLOG_UPLOAD_FOLDER, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, type BlogStatus } from '../constants';
import { useBlogTerms, useSavePost } from '../hooks';
import {
  EMPTY_POST_FORM,
  postToForm,
  saveActionsFor,
  schemaErrorMessage,
  schemaPreviewContext,
  withoutSchemaErrors,
  type PostFormValues,
  type SaveAction,
} from '../post-form';
import { blogPostInputSchema } from '../schemas';
import type { BlogPost } from '../types';
import { BlogStatusBadge } from './BlogStatusBadge';
import { SchemaEditor } from './SchemaEditor';
import { TermPicker } from './TermPicker';

export function BlogPostEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { can } = useAccess();
  const savePost = useSavePost();
  const { data: categories = [] } = useBlogTerms('categories');
  const { data: tags = [] } = useBlogTerms('tags');

  const initial = useMemo(() => (post ? postToForm(post) : EMPTY_POST_FORM), [post]);
  const [values, setValues] = useState<PostFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [errors, setErrors] = useState<FieldErrors>({});

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty && !savePost.isPending);

  const canPublish = can(PERMISSIONS.BLOG_PUBLISH);
  const status = post?.status ?? null;
  const actions = saveActionsFor(status, canPublish);
  const locked = actions.length === 0;

  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };

  const setTitle = (title: string) => {
    setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
    setErrors(({ title: _, ...rest }) => rest);
  };

  const save = async (action: SaveAction) => {
    const parsed = blogPostInputSchema.safeParse({ ...values, status: action.status });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error('Please fix the highlighted fields.');
      return;
    }
    try {
      const saved = await savePost.mutateAsync({ id: post?.id, input: parsed.data });
      toast.success(successMessage(action.status, status));
      if (!post) router.replace(`/dashboard/blogs/${saved.id}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the post.'));
    }
  };

  return (
    <div className='dashboard_page dk-editor'>
      <div className='dk-editor__bar'>
        <Link href='/dashboard/blogs' className='dk-back'>
          <ArrowLeft size={16} aria-hidden /> All posts
        </Link>
        <div className='dk-editor__bar-actions'>
          {dirty && <span className='dk-muted'>Unsaved changes</span>}
          {status === 'published' && post && (
            <a href={`/blogs/${post.slug}`} target='_blank' rel='noopener noreferrer' className='btn_secondary'>
              <ExternalLink size={14} aria-hidden /> View
            </a>
          )}
          {actions.map((action) => (
            <button
              key={action.label}
              type='button'
              className={action.primary ? 'btn_primary' : 'btn_secondary'}
              onClick={() => save(action)}
              disabled={savePost.isPending}
            >
              {savePost.isPending && savePost.variables?.input.status === action.status ? 'Saving…' : action.label}
            </button>
          ))}
        </div>
      </div>

      {locked && (
        <div className='dk-notice'>This post is live on the website. Only a DM Admin or Super Admin can change it.</div>
      )}

      <fieldset className='dk-fieldset dk-editor__grid' disabled={locked}>
        <section className='dk-card dk-editor__main'>
          <input
            className={`dk-editor__title${errors.title ? ' has-error' : ''}`}
            placeholder='Post title'
            value={values.title}
            onChange={(e) => setTitle(e.target.value)}
           
            aria-label='Title'
          />
          {errors.title && <p className='dk-field__error'>{errors.title}</p>}

          <Field label='URL slug' htmlFor='slug' error={errors.slug} hint={`/blogs/${values.slug || slugify(values.title) || '…'}`}>
            <input
              id='slug'
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
             
            />
          </Field>

          <Field label='Body' error={errors.contentHtml}>
            <RichTextEditor
              key={post?.id ?? 'new'}
              value={values.contentHtml}
              onChange={(html) => set('contentHtml', html)}
              uploadFolder={BLOG_UPLOAD_FOLDER}
              readOnly={locked}
              placeholder='Write your post. Use the toolbar for headings, lists, links and images.'
            />
          </Field>

          <Field label='Excerpt' htmlFor='excerpt' error={errors.excerpt} hint='Short summary shown on blog cards.'>
            <textarea id='excerpt' rows={3} value={values.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>
        </section>

        <aside className='dk-editor__side'>
          <div className='dk-card'>
            <h3 className='dk-card__title'>Status</h3>
            <div className='dk-meta-list'>
              <div>
                <span>Current</span>
                {status ? <BlogStatusBadge status={status} /> : <span className='dk-muted'>Not saved yet</span>}
              </div>
              {post?.publishedAt && (
                <div>
                  <span>Published</span>
                  <span>{formatDateTime(post.publishedAt)}</span>
                </div>
              )}
              {post && (
                <div>
                  <span>Last saved</span>
                  <span>{formatDateTime(post.updatedAt)}</span>
                </div>
              )}
            </div>
            <label className='dk-check'>
              <input type='checkbox' checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
              Show in the featured slider on the blog home
            </label>
            {!canPublish && status !== 'published' && (
              <p className='dk-muted dk-card__note'>You can save drafts. A DM Admin publishes them.</p>
            )}
          </div>

          <div className='dk-card'>
            <h3 className='dk-card__title'>Cover image</h3>
            <ImageField value={values.coverImageUrl} onChange={(url) => set('coverImageUrl', url)} folder={BLOG_UPLOAD_FOLDER} />
            <Field label='Alt text' htmlFor='coverAlt' error={errors.coverImageAlt}>
              <input id='coverAlt' value={values.coverImageAlt} onChange={(e) => set('coverImageAlt', e.target.value)} />
            </Field>
          </div>

          <div className='dk-card'>
            <h3 className='dk-card__title'>Category</h3>
            <select value={values.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
              <option value=''>No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className='dk-card'>
            <h3 className='dk-card__title'>Tags</h3>
            <TermPicker terms={tags} selected={values.tagIds} onChange={(ids) => set('tagIds', ids)} emptyMessage='No tags yet.' />
          </div>

          <div className='dk-card'>
            <h3 className='dk-card__title'>Search engines (SEO)</h3>
            <Field label='SEO title' htmlFor='seoTitle' error={errors.seoTitle} hint={`${values.seoTitle.length}/${SEO_TITLE_MAX} · defaults to the post title`}>
              <input id='seoTitle' maxLength={SEO_TITLE_MAX} value={values.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
            </Field>
            <Field
              label='Meta description'
              htmlFor='seoDescription'
              error={errors.seoDescription}
              hint={`${values.seoDescription.length}/${SEO_DESCRIPTION_MAX} · defaults to the excerpt`}
            >
              <textarea
                id='seoDescription'
                rows={3}
                maxLength={SEO_DESCRIPTION_MAX}
                value={values.seoDescription}
                onChange={(e) => set('seoDescription', e.target.value)}
               
              />
            </Field>
          </div>

          <div className='dk-card'>
            <h3 className='dk-card__title'>Schema (structured data)</h3>
            <SchemaEditor
              value={values.schema}
              onChange={(schema) => {
                set('schema', schema);
                setErrors(withoutSchemaErrors);
              }}
              preview={schemaPreviewContext(values, post, categories, tags)}
            />
            {schemaErrorMessage(errors) && <p className='dk-field__error'>{schemaErrorMessage(errors)}</p>}
          </div>
        </aside>
      </fieldset>
    </div>
  );
}

function successMessage(next: BlogStatus, previous: BlogStatus | null): string {
  if (next === 'published') return previous === 'published' ? 'Post updated on the website.' : 'Post published.';
  if (previous === 'published') return 'Post unpublished and saved as a draft.';
  return 'Draft saved.';
}
