import { Badge } from '@/components/dashboard/kit';
import { BLOG_STATUS_META, type BlogStatus } from '../constants';

export function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const meta = BLOG_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
