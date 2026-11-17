'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { TaxonomyKind } from './constants';
import type { BlogListQuery, BlogPostInput, BlogTermInput } from './schemas';
import type { BlogPost, BlogPostSummary, BlogTerm, Paginated } from './types';

const BASE = '/api/dashboard/blog';

export const blogKeys = {
  all: ['dashboard', 'blog'] as const,
  posts: (query: Partial<BlogListQuery>) => [...blogKeys.all, 'posts', query] as const,
  post: (id: string) => [...blogKeys.all, 'post', id] as const,
  terms: (kind: TaxonomyKind) => [...blogKeys.all, 'terms', kind] as const,
};

export function useBlogPosts(query: Partial<BlogListQuery>) {
  return useQuery({
    queryKey: blogKeys.posts(query),
    queryFn: () => api.get<Paginated<BlogPostSummary>>(`${BASE}/posts`, query),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnMount: true,
  });
}

export function useBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: blogKeys.post(id ?? ''),
    queryFn: () => api.get<{ post: BlogPost }>(`${BASE}/posts/${id}`).then((r) => r.post),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useBlogTerms(kind: TaxonomyKind) {
  return useQuery({
    queryKey: blogKeys.terms(kind),
    queryFn: () => api.get<{ terms: BlogTerm[] }>(`${BASE}/${kind}`).then((r) => r.terms),
    staleTime: 60_000,
    refetchOnMount: true,
  });
}

function useInvalidateBlog() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: blogKeys.all });
}

export function useSavePost() {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BlogPostInput }) =>
      (id ? api.put<{ post: BlogPost }>(`${BASE}/posts/${id}`, input) : api.post<{ post: BlogPost }>(`${BASE}/posts`, input)).then(
        (r) => r.post,
      ),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/posts/${id}`),
    onSuccess: invalidate,
  });
}

export function useSaveTerm(kind: TaxonomyKind) {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BlogTermInput }) =>
      id ? api.put(`${BASE}/${kind}/${id}`, input) : api.post(`${BASE}/${kind}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTerm(kind: TaxonomyKind) {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/${kind}/${id}`),
    onSuccess: invalidate,
  });
}
