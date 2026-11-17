'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import type { BlogNav, BlogTermRef } from '@/lib/blog-source';

const INLINE_CATEGORIES = 5;

export type BlogNavActive = { kind: 'home' } | { kind: 'category' | 'tag'; slug: string } | { kind: 'none' };

interface MenuProps {
  label: string;
  items: { label: string; href: string }[];
  active: boolean;
}

function NavMenu({ label, items, active }: MenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLLIElement>(null);
  const open = position !== null;

  const toggle = () => {
    const rect = ref.current?.getBoundingClientRect();
    setPosition(open || !rect ? null : { top: rect.bottom, left: rect.left });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const outside = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    document.addEventListener('mousedown', outside);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <li ref={ref} className={`bl-nav__item bl-nav__item--menu${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}>
      <button type='button' className='bl-nav__link' aria-expanded={open} onClick={toggle}>
        {label}
        <ChevronDown size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <ul className='bl-nav__dropdown' style={position ?? undefined}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} onClick={() => setPosition(null)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

const toLinks = (terms: BlogTermRef[], base: string) => terms.map((t) => ({ label: t.name, href: `${base}/${t.slug}` }));

export function BlogNavBar({ nav, active, query = '' }: { nav: BlogNav; active: BlogNavActive; query?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const inline = nav.categories.slice(0, INLINE_CATEGORIES);
  const more = nav.categories.slice(INLINE_CATEGORIES);
  const activeSlug = active.kind === 'category' || active.kind === 'tag' ? active.slug : '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/blogs/search?q=${encodeURIComponent(q)}` : '/blogs/all');
  };

  return (
    <nav className='bl-nav' aria-label='Blog sections'>
      <ul className='bl-nav__list'>
        <li className={`bl-nav__item bl-nav__item--home${active.kind === 'home' ? ' is-active' : ''}`}>
          <Link href='/blogs' className='bl-nav__link'>
            Blog Home
          </Link>
        </li>
        {inline.map((c) => (
          <li key={c.slug} className={`bl-nav__item${active.kind === 'category' && activeSlug === c.slug ? ' is-active' : ''}`}>
            <Link href={`/blogs/category/${c.slug}`} className='bl-nav__link'>
              {c.name}
            </Link>
          </li>
        ))}
        {more.length > 0 && (
          <NavMenu
            label='More'
            items={toLinks(more, '/blogs/category')}
            active={active.kind === 'category' && more.some((c) => c.slug === activeSlug)}
          />
        )}
        {nav.tags.length > 0 && <NavMenu label='Topics' items={toLinks(nav.tags, '/blogs/tag')} active={active.kind === 'tag'} />}
        <li className='bl-nav__item'>
          <Link href='/blogs/all' className='bl-nav__link'>
            All posts
          </Link>
        </li>
      </ul>

      <form className='bl-nav__search' role='search' onSubmit={submit}>
        <input type='search' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search blogs here' aria-label='Search blogs' />
        <button type='submit' aria-label='Search'>
          <Search size={18} aria-hidden />
        </button>
      </form>
    </nav>
  );
}
