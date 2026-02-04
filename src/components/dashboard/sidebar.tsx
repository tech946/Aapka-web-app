'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PriceMasterModal } from '@/app/(dashboard)/dashboard/price-master/PriceMasterClient';
import { PlatformFeeModal } from '@/app/(dashboard)/dashboard/platform-fee/PlatformFeeClient';

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
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
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
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
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
                    strokeWidth='2'
                    stroke-linecap='round'
                    strokeLinejoin='round'
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
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
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
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
            className='lucide lucide-mail w-16 h-16'
            aria-hidden='true'
          >
            <rect width='20' height='16' x='2' y='4' rx='2'></rect>
            <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
          </svg>
          <span>Contact Queries</span>
        </Link>

        {/* Agents */}
        <Link
          href='/dashboard/agents'
          className={`sidebar_item ${pathname === '/dashboard/agents' ? 'active' : ''}`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
            className='lucide lucide-users w-16 h-16'
            aria-hidden='true'
          >
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
            <circle cx='9' cy='7' r='4'></circle>
            <path d='M22 21v-2a4 4 0 0 0-3-3.87'></path>
            <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
          </svg>
          <span>Agents</span>
        </Link>

        {/* Deals of the Day */}
        <Link
          href='/dashboard/deals-of-the-day'
          className={`sidebar_item ${pathname === '/dashboard/deals-of-the-day' ? 'active' : ''}`}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            stroke-linecap='round'
            strokeLinejoin='round'
            className='lucide lucide-tag w-16 h-16'
            aria-hidden='true'
          >
            <path d='M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.586 8.586a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828Z'></path>
            <circle cx='7.5' cy='7.5' r='.5' fill='currentColor'></circle>
          </svg>
          <span>Deals of the Day</span>
        </Link>

        {/* Price Master - Button to open modal */}
        <PriceMasterSidebarButton />

        {/* Platform Fee - Button to open modal */}
        <PlatformFeeSidebarButton />
      </div>
    </div>
  );
}

function PriceMasterSidebarButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`sidebar_item ${pathname === '/dashboard/price-master' ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='lucide lucide-dollar-sign w-16 h-16'
          aria-hidden='true'
        >
          <line x1='12' x2='12' y1='2' y2='22'></line>
          <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
        </svg>
        <span>Price Master</span>
      </button>
      <PriceMasterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

function PlatformFeeSidebarButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`sidebar_item ${pathname === '/dashboard/platform-fee' ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='lucide lucide-percent w-16 h-16'
          aria-hidden='true'
        >
          <line x1='19' x2='5' y1='5' y2='19'></line>
          <circle cx='6.5' cy='6.5' r='2.5'></circle>
          <circle cx='17.5' cy='17.5' r='2.5'></circle>
        </svg>
        <span>Platform Fee</span>
      </button>
      <PlatformFeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
