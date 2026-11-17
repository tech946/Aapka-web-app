import Link from 'next/link';
import { cmsText } from '@/features/cms/preview/markers';

interface BlogSectionTitleProps {
  title: string;
  action?: { label: string; href: string };
  field?: string;
  actionField?: string;
}

export function BlogSectionTitle({ title, action, field, actionField }: BlogSectionTitleProps) {
  return (
    <div className='bl-section-title'>
      <h2 {...(field ? cmsText(field) : {})}>{title}</h2>
      {action && (
        <Link href={action.href} className='bl-section-title__action' {...(actionField ? cmsText(actionField) : {})}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
