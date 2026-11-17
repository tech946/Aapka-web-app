'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavItem } from './nav-config';

/* Sidebar group — ported from the CRM (components/dashboard/SidebarDropdown).
   Full panel: an inline expandable list. Icon rail: a flyout beside the icon. */

interface SidebarDropdownProps {
  item: NavItem;
  icon: ReactNode;
  isCollapsed: boolean;
  /** shown in the list while the children are still loading */
  emptyLabel?: string;
}

export function SidebarDropdown({ item, icon, isCollapsed, emptyLabel }: SidebarDropdownProps) {
  const pathname = usePathname() || '';
  const [isOpen, setIsOpen] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const href = item.href ?? '';

  const isRouteActive = (target: string) => pathname === target || pathname.startsWith(`${target}/`);

  // Only the most specific match is active (/influencers/invite is not also /influencers).
  const activeChildHref = (item.children ?? [])
    .filter((child) => isRouteActive(child.href))
    .reduce<string | null>((best, child) => (best === null || child.href.length > best.length ? child.href : best), null);

  const hasActiveChild = (href !== '' && isRouteActive(href)) || activeChildHref !== null;

  // Full panel: keep the group open while one of its pages is active.
  useEffect(() => {
    if (!isCollapsed) setIsOpen(Boolean(hasActiveChild));
  }, [hasActiveChild, isCollapsed]);

  // Rail: nothing stays open; flyouts are transient.
  useEffect(() => {
    if (isCollapsed) setIsOpen(false);
  }, [isCollapsed, pathname]);

  // Flyout is position: fixed (the rail clips overflow), so pin it to the trigger row.
  useLayoutEffect(() => {
    if (isCollapsed && isOpen && triggerRef.current) {
      setFlyoutTop(triggerRef.current.getBoundingClientRect().top);
    }
  }, [isCollapsed, isOpen]);

  // Flyout closes on outside click or Escape.
  useEffect(() => {
    if (!(isCollapsed && isOpen)) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isCollapsed, isOpen]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const rowClass = `sidebar_item sidebar_dropdown_toggle ${hasActiveChild ? 'active' : ''}`;

  const childLinks =
    item.children && item.children.length > 0 ? (
      item.children.map((child) => {
        const isActive = child.href === activeChildHref;
        return (
          <Link
            key={child.href}
            href={child.href}
            className={`sidebar_dropdown_item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => isCollapsed && setIsOpen(false)}
          >
            <ChevronRight className='sidebar_dropdown_caret' aria-hidden />
            <span>{child.label}</span>
          </Link>
        );
      })
    ) : emptyLabel ? (
      <span className='sidebar_dropdown_item sidebar_dropdown_item--placeholder' aria-disabled='true'>
        <ChevronRight className='sidebar_dropdown_caret' aria-hidden />
        <span>{emptyLabel}</span>
      </span>
    ) : null;

  /* ── rail: icon button + flyout ─────────────────────────────────────── */
  if (isCollapsed) {
    return (
      <div className='sidebar-dropdown' ref={rootRef}>
        <button
          ref={triggerRef as RefObject<HTMLButtonElement>}
          type='button'
          onClick={toggle}
          className={`${rowClass} ${isOpen ? 'flyout-open' : ''}`}
          title={item.label}
          aria-haspopup='menu'
          aria-expanded={isOpen}
        >
          <span className='sidebar_item_icon'>{icon}</span>
          <span className='sidebar_item_label'>{item.label}</span>
        </button>

        {isOpen && (
          <div className='sidebar_flyout' role='menu' style={{ top: flyoutTop }}>
            {item.navigateParent && href ? (
              <Link href={href} className='sidebar_flyout_title sidebar_flyout_title--link' onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <div className='sidebar_flyout_title'>{item.label}</div>
            )}
            <div className='sidebar_flyout_list'>{childLinks}</div>
          </div>
        )}
      </div>
    );
  }

  /* ── full panel: inline expandable group ────────────────────────────── */
  return (
    <div className='sidebar-dropdown' ref={rootRef}>
      {item.navigateParent && href ? (
        <div className={`${rowClass} sidebar_dropdown_row`}>
          <Link href={href} className='sidebar_dropdown_nav' onClick={() => setIsOpen(true)}>
            <span className='sidebar_item_icon'>{icon}</span>
            <span className='sidebar_item_label'>{item.label}</span>
          </Link>
          <button
            type='button'
            className='sidebar_dropdown_chevron'
            onClick={toggle}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label} menu`}
          >
            <ChevronDown className={`sidebar_dropdown_arrow ${isOpen ? 'open' : ''}`} />
          </button>
        </div>
      ) : (
        <button type='button' onClick={toggle} className={rowClass} aria-expanded={isOpen}>
          <span className='sidebar_item_icon'>{icon}</span>
          <span className='sidebar_item_label'>{item.label}</span>
          <ChevronDown className={`sidebar_dropdown_arrow ${isOpen ? 'open' : ''}`} />
        </button>
      )}

      {isOpen && childLinks && <div className='sidebar_dropdown_menu'>{childLinks}</div>}
    </div>
  );
}
