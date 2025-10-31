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
        {/* Dashboard Home */}
        <Link
          href='/dashboard'
          className={`sidebar_item ${pathname === '/dashboard' ? 'active' : ''}`}
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
            className='lucide lucide-house w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'></path>
            <path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
          </svg>
          <span>Dashboard</span>
        </Link>

        {/* Main Navigation */}
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
            className='lucide lucide-user w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
            <circle cx='12' cy='7' r='4'></circle>
          </svg>
          <span>All Users</span>
        </Link>

        <Link
          href='/dashboard/mobile-home'
          className={`sidebar_item ${pathname === '/dashboard/mobile-home' ? 'active' : ''}`}
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
            className='lucide lucide-smartphone w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <rect width='14' height='20' x='5' y='2' rx='2' ry='2'></rect>
            <path d='M12 18h.01'></path>
          </svg>
          <span>Mobile Home</span>
        </Link>

        <Link
          href='/dashboard/default-search'
          className={`sidebar_item ${pathname === '/dashboard/default-search' ? 'active' : ''}`}
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
            className='lucide lucide-search w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='m21 21-4.34-4.34'></path>
            <circle cx='11' cy='11' r='8'></circle>
          </svg>
          <span>Default Search</span>
        </Link>

        {/* Master Data Section */}
        <div className='sidebar_section'>
          <span className='sidebar_section_title'>Master Data</span>
        </div>

        <Link
          href='/dashboard/master'
          className={`sidebar_item ${pathname === '/dashboard/master' ? 'active' : ''}`}
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
            className='lucide lucide-settings w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'></path>
            <circle cx='12' cy='12' r='3'></circle>
          </svg>
          <span>Master Data</span>
        </Link>

        <Link
          href='/dashboard/master/developers'
          className={`sidebar_item ${pathname === '/dashboard/master/developers' ? 'active' : ''}`}
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
            className='lucide lucide-building-2 w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
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
          <span>Developers</span>
        </Link>

        <Link
          href='/dashboard/master/property-types'
          className={`sidebar_item ${pathname === '/dashboard/master/property-types' ? 'active' : ''}`}
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
            className='lucide lucide-home w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
            <polyline points='9,22 9,12 15,12 15,22'></polyline>
          </svg>
          <span>Property Types</span>
        </Link>

        <Link
          href='/dashboard/master/property-status'
          className={`sidebar_item ${pathname === '/dashboard/master/property-status' ? 'active' : ''}`}
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
            className='lucide lucide-activity w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M22 12h-4l-3 9L9 3l-3 9H2'></path>
          </svg>
          <span>Property Status</span>
        </Link>

        <Link
          href='/dashboard/master/amenities'
          className={`sidebar_item ${pathname === '/dashboard/master/amenities' ? 'active' : ''}`}
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
            className='lucide lucide-star w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <polygon points='12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26'></polygon>
          </svg>
          <span>Amenities</span>
        </Link>

        <Link
          href='/dashboard/master/unit-types'
          className={`sidebar_item ${pathname === '/dashboard/master/unit-types' ? 'active' : ''}`}
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
            className='lucide lucide-package w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M16.5 9.4 7.55 4.24'></path>
            <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
            <polyline points='3.29 7 12 12 20.71 7'></polyline>
            <line x1='12' x2='12' y1='22' y2='12'></line>
          </svg>
          <span>Unit Types</span>
        </Link>

        <Link
          href='/dashboard/master/countries'
          className={`sidebar_item ${pathname === '/dashboard/master/countries' ? 'active' : ''}`}
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
            className='lucide lucide-globe w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <circle cx='12' cy='12' r='10'></circle>
            <path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'></path>
            <path d='M2 12h20'></path>
          </svg>
          <span>Countries</span>
        </Link>

        <Link
          href='/dashboard/master/states'
          className={`sidebar_item ${pathname === '/dashboard/master/states' ? 'active' : ''}`}
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
            className='lucide lucide-map w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M3 6h3'></path>
            <path d='M17 6h.01'></path>
            <rect width='18' height='12' x='3' y='6' rx='2'></rect>
            <circle cx='12' cy='13' r='2'></circle>
          </svg>
          <span>States</span>
        </Link>

        <Link
          href='/dashboard/master/cities'
          className={`sidebar_item ${pathname === '/dashboard/master/cities' ? 'active' : ''}`}
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
            <rect width='16' height='20' x='4' y='2' rx='2' ry='2'></rect>
            <path d='M9 22v-4h6v4'></path>
            <path d='M8 6h.01'></path>
            <path d='M16 6h.01'></path>
            <path d='M12 6h.01'></path>
            <path d='M12 10h.01'></path>
            <path d='M12 14h.01'></path>
            <path d='M16 10h.01'></path>
            <path d='M16 14h.01'></path>
            <path d='M8 10h.01'></path>
            <path d='M8 14h.01'></path>
          </svg>
          <span>Cities</span>
        </Link>

        <Link
          href='/dashboard/master/areas'
          className={`sidebar_item ${pathname === '/dashboard/master/areas' ? 'active' : ''}`}
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
            className='lucide lucide-map-pin w-16 h-16 transition-all text-black-alpha-56 group-hover:text-black-alpha-72'
            aria-hidden='true'
          >
            <path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'></path>
            <circle cx='12' cy='10' r='3'></circle>
          </svg>
          <span>Areas</span>
        </Link>
      </div>
    </div>
  );
}
