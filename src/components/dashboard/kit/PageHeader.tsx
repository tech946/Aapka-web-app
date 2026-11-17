import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  const hasToolbar = Boolean(children || actions);

  return (
    <div className='heading_block heading_block--actions'>
      <div className='heading_text'>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {hasToolbar && (
        <div className='table_toolbar'>
          {children}
          {actions && <div className='table_actions dk-header-actions'>{actions}</div>}
        </div>
      )}
    </div>
  );
}
