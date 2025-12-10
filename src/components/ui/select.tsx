'use client';

import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}: SelectProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={className}
      style={{
        padding: '0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        width: '100%',
        backgroundColor: disabled ? '#f3f4f6' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <option value=''>{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

