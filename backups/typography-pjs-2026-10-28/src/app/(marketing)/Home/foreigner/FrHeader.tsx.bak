'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { ALL_HOLIDAYS, useHolidayMenu } from '@/components/site/useHolidayMenu';

type Item = { label: string; href: string };

const SOLID_AFTER = 88;
const CLOSE_DELAY = 160;

function samePath(pathname: string, href: string) {
  const path = href.split('?')[0];
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');
}

function NavLink({ label, href, active }: Item & { active: boolean }) {
  return (
    <Link href={href} className={'fr-nav__link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined}>
      {label}
    </Link>
  );
}

function Chevron({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Dropdown({ label, items, wide, pathname }: { label: string; items: Item[]; wide?: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const active = items.some((it) => samePath(pathname, it.href));

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = () => {
    clear();
    setOpen(true);
  };
  const hideSoon = () => {
    clear();
    timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  useEffect(() => () => clear(), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = () => Array.from(root.current?.querySelectorAll<HTMLAnchorElement>('.fr-dd__link') ?? []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => links()[0]?.focus());
      return;
    }
    const all = links();
    const at = all.indexOf(document.activeElement as HTMLAnchorElement);
    const next = e.key === 'ArrowDown' ? (at + 1) % all.length : (at - 1 + all.length) % all.length;
    all[at < 0 ? 0 : next]?.focus();
  };

  return (
    <div
      ref={root}
      className={'fr-dd' + (open ? ' is-open' : '') + (active ? ' is-active' : '')}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onKeyDown={onKeyDown}
    >
      <button
        ref={button}
        type="button"
        className="fr-dd__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <Chevron className="fr-dd__chev" />
      </button>
      <div id={listId} className={'fr-dd__list' + (wide ? ' is-wide' : '')}>
        <div className="fr-dd__card">
          {items.map((it) => {
            const on = samePath(pathname, it.href);
            return (
              <Link
                key={it.href + it.label}
                href={it.href}
                className={'fr-dd__link' + (on ? ' is-active' : '')}
                aria-current={on ? 'page' : undefined}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
              >
                {it.label}
                <svg className="fr-dd__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function useScrollFade(enabled: boolean) {
  const [fade, setFade] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => setFade(Math.min(1, window.scrollY / SOLID_AFTER));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);
  return fade;
}

export default function FrHeader({ tone = 'cream', placement = 'fixed' }: { tone?: 'cream' | 'light'; placement?: 'fixed' | 'static' }) {
  const holidays = useHolidayMenu();
  const pathname = usePathname() || '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const light = tone === 'light';
  const fade = useScrollFade(light);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const holidayItems: Item[] = [ALL_HOLIDAYS, ...holidays].map(({ label, href }) => ({ label, href }));
  const moreItems: Item[] = [
    { label: 'Oman Visa', href: '/visas/apply-for-oman-visa' },
    { label: 'Oman Transport', href: '/oman-transport' },
    { label: 'FAQs', href: '/faq' },
    { label: 'About Us', href: '/About' },
  ];
  const dealsHref = holidaysHref(LIMITED_DEALS.key);

  const logo = (onDark: boolean) =>
    onDark ? (
      <img className="fr-logo__img" src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="Aapka Tourism" />
    ) : (
      <img className="fr-logo__img" src="/aapka-tourism-logo-footer.png" width="500" height="500" alt="Aapka Tourism" />
    );

  return (
    <div className={'fr-navbar' + (light ? ' fr-navbar--light' : '') + (placement === 'static' ? ' fr-navbar--static' : '') + (menuOpen ? ' is-open' : '')}>
      <div className="fr-nav" style={light ? { backgroundColor: `color-mix(in srgb, var(--fr-dark) ${Math.round(fade * 100)}%, transparent)` } : undefined}>
        <div className="fr-nav__flex">
          <Link href="/" className="fr-logo" aria-label="Aapka Tourism home">
            {logo(light)}
          </Link>
          <button type="button" className="fr-nav__backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" tabIndex={-1} />
          <nav className="fr-nav__menu" aria-label="Main">
            <div className="fr-nav__tablet">
              <Link href="/" className="fr-logo fr-logo--tablet" aria-label="Aapka Tourism home">
                {logo(false)}
              </Link>
              <button type="button" className="fr-nav__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="fr-nav__wrap" onClick={(e) => (e.target as HTMLElement).closest('a') && setMenuOpen(false)}>
              <div className="fr-nav__side">
                <NavLink label={LIMITED_DEALS.label} href={dealsHref} active={false} />
                {holidayItems.length > 1 && <Dropdown label="Holidays" items={holidayItems} pathname={pathname} />}
                <NavLink label="Become a Partner" href="/become-partner" active={samePath(pathname, '/become-partner')} />
              </div>
              <div className="fr-nav__side fr-nav__side--right">
                <NavLink label="Blogs" href="/blogs" active={samePath(pathname, '/blogs')} />
                <NavLink label="Contact Us" href="/contact" active={samePath(pathname, '/contact')} />
                <Dropdown label="More" items={moreItems} wide pathname={pathname} />
                <Link href="/travel-enquiry" className="fr-nav__cta">
                  Plan a trip
                </Link>
              </div>
            </div>
          </nav>
          <button type="button" className="fr-nav__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
