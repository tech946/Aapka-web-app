'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFlagImageUrl, CountryOption, COUNTRIES } from '@/lib/countries';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select country',
  disabled = false,
  error = false,
  className,
  searchable = true,
  searchPlaceholder = 'Search countries...',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverBorder, setHoverBorder] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? COUNTRIES.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COUNTRIES;

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    } else if (searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isSelectingRef.current) {
        return;
      }
      
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(target)
      ) {
        return;
      }
      if (
        selectRef.current &&
        selectRef.current.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    function updatePosition() {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 240;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        let top = shouldOpenUpward 
          ? rect.top - Math.min(dropdownHeight, spaceAbove - 8)
          : rect.bottom + 4;
        
        let left = rect.left;
        let width = rect.width;
        
        if (left + width > viewportWidth) {
          width = Math.min(width, viewportWidth - left - 8);
        }
        if (left < 0) {
          left = 8;
          width = Math.min(width, viewportWidth - 16);
        }
        
        if (top < 0) {
          top = 8;
        }
        if (top + dropdownHeight > viewportHeight) {
          top = viewportHeight - dropdownHeight - 8;
        }
        
        setDropdownPosition({
          top: top,
          left: left,
          width: width,
        });
      }
    }

    if (isOpen) {
      updatePosition();
      
      const handleScroll = () => {
        updatePosition();
      };
      
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', handleScroll, true);
      
      const scrollableParents: (Element | Window)[] = [window];
      let parent: Element | null = buttonRef.current?.parentElement || null;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || 
            style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll') {
          scrollableParents.push(parent);
          parent.addEventListener('scroll', handleScroll, true);
        }
        parent = parent.parentElement;
      }
      
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true);
      }, 100);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', handleScroll, true);
        scrollableParents.forEach((parent) => {
          if (parent instanceof Element) {
            parent.removeEventListener('scroll', handleScroll, true);
          }
        });
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isOpen]);

  const selectedOption = COUNTRIES.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onChange(optionValue);
    setIsOpen(false);
  };

  const borderColor = error
    ? '#ef4444'
    : isOpen
      ? '#ff4c00'
      : hoverBorder && !disabled
        ? '#ff4c00'
        : '#e5e7eb';

  const dropdownContent = isOpen && (
    <>
      <div
        className='fixed inset-0 z-[99998]'
        style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
      />
      <div
        ref={dropdownRef}
        className='fixed z-[99999] rounded-md border bg-white shadow-lg'
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'BUTTON') {
            e.stopPropagation();
          }
        }}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          borderColor: '#e5e7eb',
          boxShadow:
            '0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 10px rgba(0, 0, 0, 0.05)',
          pointerEvents: 'auto',
        }}
      >
        {searchable && (
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type='text'
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation();
                setSearchQuery(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                color: '#111827',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        )}
        <div
          className='max-h-60 overflow-auto p-1'
          style={{ maxHeight: searchable ? '200px' : '240px' }}
        >
          {filteredOptions.length === 0 ? (
            <div className='px-3 py-2' style={{ color: '#6b7280', fontSize: '12px' }}>
              {searchable && searchQuery ? 'No matching countries' : 'No countries available'}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type='button'
                  onMouseDown={(e) => {
                    isSelectingRef.current = true;
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                    onChange(option.value);
                    setIsOpen(false);
                    setTimeout(() => {
                      isSelectingRef.current = false;
                      setSearchQuery('');
                    }, 200);
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 outline-none',
                    'transition-colors duration-150',
                    'hover:bg-gray-100 active:bg-gray-200'
                  )}
                  style={{
                    backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                    color: '#111827',
                    pointerEvents: 'auto',
                    zIndex: 100000,
                    fontSize: '12px',
                  }}
                >
                  <img
                    src={getFlagImageUrl(option.flagCode, 'w20')}
                    alt={option.label}
                    style={{
                      width: '20px',
                      height: '15px',
                      marginRight: '8px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                    }}
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className='flex-1 text-left'>{option.label}</span>
                  {isSelected && (
                    <Check
                      className='ml-2 h-4 w-4'
                      style={{ color: '#ff4c00' }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  return (
    <div ref={selectRef} className={cn('relative w-full', className)}>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-md border px-3 py-2',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
        )}
        style={{
          height: '100%',
          minHeight: '40px',
          borderColor: borderColor,
          backgroundColor: '#ffffff',
          color: selectedOption ? '#111827' : '#6b7280',
          outline: isOpen ? '2px solid #ff4c00' : 'none',
          outlineOffset: isOpen ? '2px' : '0',
          fontSize: '12px',
        }}
        onMouseEnter={() => !disabled && !isOpen && setHoverBorder(true)}
        onMouseLeave={() => setHoverBorder(false)}
      >
        <span className='flex-1 text-left flex items-center gap-2'>
          {selectedOption ? (
            <>
              <img
                src={getFlagImageUrl(selectedOption.flagCode, 'w20')}
                alt={selectedOption.label}
                style={{
                  width: '20px',
                  height: '15px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {selectedOption.label}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {typeof window !== 'undefined' && isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
}
