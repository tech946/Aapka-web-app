'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export function Modal({ title, onClose, children, footer, width = 'md' }: ModalProps) {
  return (
    <div className='modal_overlay'>
      <div
        className={`modal dk-modal dk-modal--${width}`}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal_header'>
          <h4>{title}</h4>
          <button type='button' className='modal_close' onClick={onClose} aria-label='Close'>
            <X aria-hidden />
          </button>
        </div>
        <div className='modal_body'>{children}</div>
        {footer && <div className='modal_footer'>{footer}</div>}
      </div>
    </div>
  );
}
