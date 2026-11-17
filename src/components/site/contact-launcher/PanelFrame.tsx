'use client';

import type { ReactNode } from 'react';
import { Minus, X } from 'lucide-react';

interface PanelFrameProps {
  title: string;
  subtitle?: ReactNode;
  avatar?: boolean;
  hidden: boolean;
  onMinimize: () => void;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function BrandAvatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span className={`cl-avatar cl-avatar--${size}`} aria-hidden>
      <img src='/brand/aapka-sun-mark.png' alt='' />
    </span>
  );
}

export function PanelFrame({
  title,
  subtitle,
  avatar = false,
  hidden,
  onMinimize,
  onClose,
  footer,
  className = '',
  bodyClassName = '',
  children,
}: PanelFrameProps) {
  return (
    <section className={`cl-panel ${className}`} role='dialog' aria-label={title} hidden={hidden}>
      <header className='cl-panel__head'>
        {avatar && <BrandAvatar size='lg' />}
        <div className='cl-panel__titles'>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className='cl-panel__tools'>
          <button type='button' onClick={onMinimize} aria-label='Minimise'>
            <Minus size={18} aria-hidden />
          </button>
          <button type='button' onClick={onClose} aria-label='Close'>
            <X size={18} aria-hidden />
          </button>
        </div>
      </header>
      <div className={`cl-panel__body ${bodyClassName}`}>{children}</div>
      {footer && <footer className='cl-panel__foot'>{footer}</footer>}
    </section>
  );
}
