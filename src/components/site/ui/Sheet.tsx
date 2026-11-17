'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../styles/sheet.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the sheet (usually a heading in `head`) */
  labelledBy: string;
  /**
   * full    the whole screen, slides up (menus, search, filters)
   * bottom  a panel rising over a dimmed page (short pickers such as sort);
   *         tapping the dimmed page closes it
   * modal   full screen on phones; from 768px up a centred dialog over a
   *         dimmed, blurred page (the homepage search on desktop)
   */
  variant?: 'full' | 'bottom' | 'modal';
  /** top bar: back/close button, title… (laid out by .ui-sheet__head) */
  head: ReactNode;
  /** fixed strip under the head that doesn't scroll, e.g. section tabs */
  toolbar?: ReactNode;
  /** pinned bottom bar, e.g. the primary action */
  foot?: ReactNode;
  /** close when a link inside the body is followed (menus) */
  closeOnLinkClick?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

/* The phone's modal. Handles the plumbing once: portal to <body> (so no
   parent stacking context can trap it), scroll lock, Esc, focus in on open
   and back out on close, inert while closed. Focus goes to the first
   [data-autofocus] element inside, else the panel itself.
   Styles: styles/sheet.css. */
export default function Sheet({
  open,
  onClose,
  labelledBy,
  variant = 'full',
  head,
  toolbar,
  foot,
  closeOnLinkClick,
  id,
  className,
  children,
}: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // latest onClose without re-running the open effect (callers often pass a new arrow each render)

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = 'hidden';

    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
    target?.focus({ preventScroll: true });

    return () => {
      root.style.overflow = prevOverflow;
      prevFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  const onBodyClick = closeOnLinkClick
    ? (e: MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('a')) onClose();
      }
    : undefined;

  if (!mounted) return null;

  const bottom = variant === 'bottom';
  const modal = variant === 'modal';

  return createPortal(
    <div className="at-site">
      {(bottom || modal) && (
        <div className={'ui-sheet-overlay' + (modal ? ' ui-sheet-overlay--modal' : '') + (open ? ' is-open' : '')} aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        id={id}
        className={'ui-sheet' + (bottom ? ' ui-sheet--bottom' : '') + (modal ? ' ui-sheet--modal' : '') + (open ? ' is-open' : '') + (className ? ' ' + className : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        inert={!open}
      >
        <header className="ui-sheet__head">{head}</header>
        {toolbar ? <div className="ui-sheet__toolbar">{toolbar}</div> : null}
        <div className="ui-sheet__body" onClick={onBodyClick}>
          {children}
        </div>
        {foot ? <footer className="ui-sheet__foot">{foot}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
