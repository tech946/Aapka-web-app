'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Modal } from 'antd';
import {
  ChevronDown,
  Globe,
  Lock,
  LogOut,
  Mail,
  Menu,
  RotateCw,
  UserPlus,
} from 'lucide-react';
import { EmailTemplatePreview } from './EmailTemplatePreview';
import { useAccess } from '@/hooks/use-access';
import { usePackageCategories } from '@/hooks/use-marketing-queries';
import { PERMISSIONS } from '@/lib/access';
import { userDisplayName, userInitials } from '@/lib/user-display';
import { useUserStore } from '@/store/user-store';
import { useSidebarLayoutStore } from '@/store/sidebar-layout-store';
import { breadcrumbsFor, buildNav, visibleNav } from './nav-config';

/** Closes a popover on outside press / Escape. */
function useDismiss(open: boolean, close: () => void, ...refs: Array<React.RefObject<HTMLElement | null>>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // refs are stable objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);
}

export function Header() {
  const pathname = usePathname() || '/dashboard';
  const router = useRouter();
  const { user, can, isSuperAdmin, roleLabel: roleName } = useAccess();
  const clearUser = useUserStore((s) => s.clearUser);
  const isCollapsed = useSidebarLayoutStore((s) => s.isCollapsed);
  const toggleCollapsed = useSidebarLayoutStore((s) => s.toggleCollapsed);
  const { data: rawCategories = [] } = usePackageCategories(100);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useDismiss(menuOpen, () => setMenuOpen(false), menuRef);

  const categories = useMemo(
    () =>
      (rawCategories as Array<Record<string, unknown>>)
        .map((c) => ({ id: String(c.id ?? c.category_id ?? ''), name: String(c.name ?? '') }))
        .filter((c) => c.id && c.name),
    [rawCategories],
  );
  const crumbs = useMemo(
    () => breadcrumbsFor(pathname, visibleNav(buildNav(categories), [PERMISSIONS.ALL])),
    [pathname, categories],
  );

  const displayName = userDisplayName(user);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        clearUser();
        localStorage.clear();
        sessionStorage.clear();
        router.push('/auth/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className='header header--minimal'>
      <div className='header__leading'>
        <button
          type='button'
          className='header-menu-toggle header-menu-toggle--strong'
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={24} strokeWidth={2} aria-hidden />
        </button>

        <div className='header-user-wrap' ref={menuRef}>
          <button
            type='button'
            className={`header-user${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup='menu'
            aria-expanded={menuOpen}
            title={user?.email}
          >
            <span className='header-user__avatar'>
              <span className='header-user__avatar-initials' aria-hidden>
                {userInitials(displayName)}
              </span>
            </span>
            <span className='header-user__body'>
              <span className='header-user__name'>{displayName}</span>
              <span className='header-user__login'>{roleName}</span>
            </span>
            <ChevronDown className='header-user__chev' size={14} strokeWidth={2.2} aria-hidden />
          </button>

          {menuOpen && (
            <div className='header-menu' role='menu'>
              <div className='header-menu__head'>
                <span className='header-menu__name'>{displayName}</span>
                <span className='header-menu__email'>{user?.email}</span>
                <span className='header-menu__role'>{roleName}</span>
              </div>
              {can(PERMISSIONS.USERS_WRITE) && (
                <Link
                  role='menuitem'
                  className='header-menu__item'
                  href='/dashboard/users/new'
                  onClick={() => setMenuOpen(false)}
                >
                  <UserPlus aria-hidden />
                  Add team member
                </Link>
              )}
              {isSuperAdmin && (
                <button
                  type='button'
                  role='menuitem'
                  className='header-menu__item'
                  onClick={() => {
                    setMenuOpen(false);
                    setShowEmailPreview(true);
                  }}
                >
                  <Mail aria-hidden />
                  Preview email templates
                </button>
              )}
              <a role='menuitem' className='header-menu__item' href='/' target='_blank' rel='noopener noreferrer'>
                <Globe aria-hidden />
                Open website
              </a>
              <div className='header-menu__divider' />
              <button
                type='button'
                role='menuitem'
                className='header-menu__item header-menu__item--danger'
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut aria-hidden />
                {loggingOut ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Address bar: breadcrumb trail reads as the location, reload sits on the right */}
      <div className='header-addressbar'>
        <span className='header-addressbar__lock' aria-hidden>
          <Lock size={12} strokeWidth={2.25} />
        </span>
        <nav className='header-breadcrumbs' aria-label='Breadcrumb'>
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className='header-breadcrumbs__segment'>
              {i > 0 && (
                <span className='header-breadcrumbs__sep' aria-hidden>
                  /
                </span>
              )}
              {crumb.href ? (
                <Link href={crumb.href} className='header-breadcrumbs__link'>
                  {crumb.label}
                </Link>
              ) : (
                <span className='header-breadcrumbs__current'>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <button
          type='button'
          className='header-addressbar__reload'
          onClick={() => window.location.reload()}
          aria-label='Reload page'
          title='Reload page'
        >
          <RotateCw size={13} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className='header__trailing'>
        <a
          href='/'
          target='_blank'
          rel='noopener noreferrer'
          className='header-quick-link'
          title='Open the website in a new tab'
        >
          <span className='header-quick-link__icon' aria-hidden>
            <Globe className='header-quick-link__icon-line' strokeWidth={1.75} />
          </span>
          <span className='header-quick-link__label'>Website</span>
        </a>
        <button
          type='button'
          className='header__settings header__logout'
          aria-label='Log out'
          title='Log out'
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <Modal
        open={showEmailPreview}
        onCancel={() => setShowEmailPreview(false)}
        footer={null}
        width='90%'
        style={{ maxWidth: '1200px' }}
        title='Email Template Preview'
      >
        <EmailTemplatePreview />
      </Modal>
    </div>
  );
}
