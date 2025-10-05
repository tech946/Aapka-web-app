'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  return (
    <div className='sidebar'>
      <div className='logo'>Proptz</div>
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
        <div className='sidebar_item'>
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>Home</span>
        </div>
        <Link
          href='/dashboard/users'
          className={`sidebar_item ${pathname === '/dashboard/users' ? 'active' : ''}`}
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
            className='lucide lucide-users w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
            <circle cx='9' cy='7' r='4'></circle>
            <path d='m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828l2.828 2.828Z'></path>
            <circle cx='18' cy='8' r='2'></circle>
          </svg>
          <span>All Users</span>
        </Link>
        <Link
          href='/dashboard/leads'
          className={`sidebar_item ${pathname === '/dashboard/leads' ? 'active' : ''}`}
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
            className='lucide lucide-users w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
            <circle cx='9' cy='7' r='4'></circle>
            <path d='m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828l2.828 2.828Z'></path>
            <circle cx='18' cy='8' r='2'></circle>
          </svg>
          <span>All Leads</span>
        </Link>
        <Link
          href='/dashboard/properties'
          className={`sidebar_item ${pathname === '/dashboard/properties' ? 'active' : ''}`}
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
            className='lucide lucide-building w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z'></path>
            <path d='M6 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'></path>
            <path d='M18 9h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-2'></path>
            <path d='M10 6h4'></path>
            <path d='M10 10h4'></path>
            <path d='M10 14h4'></path>
            <path d='M10 18h4'></path>
          </svg>
          <span>Properties</span>
        </Link>
        <div className='sidebar_item'>
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>Our Team</span>
        </div>
        <div className='sidebar_item'>
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>user Queries</span>
        </div>
        <div className='sidebar_item'>
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>Feedback</span>
        </div>
        <div className='sidebar_item'>
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
}
