'use client';

import { Toaster } from 'sonner';
import { AlertTriangle, Check, Info, Loader2, X } from 'lucide-react';
import './site-toaster.css';

export default function SiteToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 80, right: 24 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      gap={10}
      visibleToasts={4}
      closeButton
      className="desert-ember at-toaster"
      icons={{
        success: <Check aria-hidden="true" />,
        error: <X aria-hidden="true" />,
        warning: <AlertTriangle aria-hidden="true" />,
        info: <Info aria-hidden="true" />,
        loading: <Loader2 className="at-toast__spin" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'at-toast',
          content: 'at-toast__content',
          title: 'at-toast__title',
          description: 'at-toast__desc',
          icon: 'at-toast__icon',
          closeButton: 'at-toast__close',
          actionButton: 'at-toast__action',
          cancelButton: 'at-toast__cancel',
          success: 'is-success',
          error: 'is-error',
          warning: 'is-warning',
          info: 'is-info',
          loading: 'is-loading',
        },
      }}
    />
  );
}
