'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Category = { id: string; name: string };

export function Sidebar() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        setLoadingCats(true);
        const res = await fetch('/api/package-categories?limit=100', {
          method: 'GET',
          signal: controller.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && Array.isArray(json.data)) {
          setCategories(
            json.data.map((r: any) => ({ id: r.id, name: r.name }))
          );
        } else {
          setCategories([]);
        }
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingCats(false);
      }
    }
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  return (
    <div className='sidebar'>
      <div className='logo'>Aapka Tourism</div>
      <div className='searchbar'>
        <div className='searchbar-inner'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-search w-16 h-16 text-foreground-dimmer'
            aria-hidden='true'
          >
            <path d='m21 21-4.34-4.34'></path>
            <circle cx='11' cy='11' r='8'></circle>
          </svg>
          <input type='text' placeholder='Search' />
          <span>⌘</span>
        </div>
      </div>
      <div className='sidebar_menu'>
        {/* Packages (tree) */}
        <Link
          href='/dashboard/package-categories'
          className={`sidebar_item ${pathname === '/dashboard/package-categories' ? 'active' : ''}`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-package w-16 h-16'
            aria-hidden='true'
          >
            <path d='M16.5 9.4 7.55 4.24'></path>
            <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
            <polyline points='3.29 7 12 12 20.71 7'></polyline>
            <line x1='12' x2='12' y1='22' y2='12'></line>
          </svg>
          <span>Packages</span>
        </Link>
        {/* Children: package categories */}
        <div style={{ paddingLeft: 24 }}>
          {loadingCats && (
            <div className='sidebar_item' style={{ opacity: 0.7 }}>
              <span>Loading categories...</span>
            </div>
          )}
          {!loadingCats &&
            categories.map(cat => {
              const slug = toSlug(cat.name);
              const href = `/dashboard/package-categories/${encodeURIComponent(slug)}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`sidebar_item ${isActive ? 'active' : ''}`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    className='lucide lucide-folder'
                    aria-hidden='true'
                  >
                    <path d='M3 7h5l2 3h11v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
                  </svg>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
        </div>

        {/* Payments */}
        <Link
          href='/dashboard/payments'
          className={`sidebar_item ${pathname === '/dashboard/payments' ? 'active' : ''}`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-credit-card w-16 h-16'
            aria-hidden='true'
          >
            <rect width='20' height='14' x='2' y='5' rx='2'></rect>
            <line x1='2' x2='22' y1='10' y2='10'></line>
          </svg>
          <span>Payments</span>
        </Link>

        {/* Contact Queries */}
        <Link
          href='/dashboard/contact-queries'
          className={`sidebar_item ${pathname === '/dashboard/contact-queries' ? 'active' : ''}`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-mail w-16 h-16'
            aria-hidden='true'
          >
            <rect width='20' height='16' x='2' y='4' rx='2'></rect>
            <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
          </svg>
          <span>Contact Queries</span>
        </Link>
      </div>
    </div>
  );
}
