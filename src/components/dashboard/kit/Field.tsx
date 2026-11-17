import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className={`form_row full_width dk-field${error ? ' dk-field--error' : ''}`}>
      <label htmlFor={htmlFor}>
        <span>
          {label}
          {required && <span className='dk-field__required'> *</span>}
        </span>
      </label>
      {children}
      {error ? <p className='dk-field__error'>{error}</p> : hint ? <p className='dk-field__hint'>{hint}</p> : null}
    </div>
  );
}
