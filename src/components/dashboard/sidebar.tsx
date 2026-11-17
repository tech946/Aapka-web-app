'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PriceMasterModal } from '@/app/(dashboard)/dashboard/price-master/PriceMasterClient';
import { PlatformFeeModal } from '@/app/(dashboard)/dashboard/platform-fee/PlatformFeeClient';
import { useAccess } from '@/hooks/use-access';
import { usePackageCategories } from '@/hooks/use-marketing-queries';
import { useSidebarLayoutStore } from '@/store/sidebar-layout-store';
import { SidebarDropdown } from './SidebarDropdown';
import { buildNav, visibleNav, type NavItem } from './nav-config';

export function Sidebar() {
  const pathname = usePathname() || '';
  const { permissions, landingPath } = useAccess();
  const { data: rawCategories = [], isLoading: loadingCategories } = usePackageCategories(100);
  const isCollapsed = useSidebarLayoutStore((s) => s.isCollapsed);
  const hydrateCollapsed = useSidebarLayoutStore((s) => s.hydrateCollapsed);
  const [modal, setModal] = useState<NavItem['modal'] | null>(null);

  const categories = useMemo(
    () =>
      (rawCategories as Array<Record<string, unknown>>)
        .map((c) => ({ id: String(c.id ?? c.category_id ?? ''), name: String(c.name ?? '') }))
        .filter((c) => c.id && c.name),
    [rawCategories],
  );
  const sections = useMemo(() => visibleNav(buildNav(categories), permissions), [categories, permissions]);

  useEffect(() => {
    hydrateCollapsed();
  }, [hydrateCollapsed]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '232px');
  }, [isCollapsed]);

  return (
    <div className={`sidebar${isCollapsed ? ' collapsed' : ''}`} data-collapsed={isCollapsed}>
      <div className='sidebar_header'>
        <Link href={landingPath} className='sidebar_brand' title='Aapka Tourism'>
          <img
            src='/brand/aapka-sun-mark.png'
            alt=''
            className='sidebar_brand_mark'
            width={40}
            height={20}
            draggable={false}
            aria-hidden
          />
          <span className='sidebar_brand_name'>Aapka Tourism</span>
        </Link>
      </div>

      <nav className='sidebar_menu' aria-label='Main navigation'>
        {sections.map((section, sIdx) => (
          <div
            key={section.label || 'overview'}
            className={`sidebar_section ${sIdx === 0 ? 'sidebar_section--first' : ''}`}
            role='group'
            aria-label={section.label || 'Overview'}
          >
            {section.label && (
              <div className='sidebar_section_title' aria-hidden={isCollapsed}>
                <span>{section.label}</span>
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const icon = <Icon className='sidebar_icon_line' strokeWidth={1.75} aria-hidden />;

              if (item.children) {
                return (
                  <SidebarDropdown
                    key={item.label}
                    item={item}
                    icon={icon}
                    isCollapsed={isCollapsed}
                    emptyLabel={item.navigateParent && loadingCategories ? 'Loading…' : undefined}
                  />
                );
              }

              if (item.modal) {
                return (
                  <button
                    key={item.label}
                    type='button'
                    className='sidebar_item'
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => setModal(item.modal)}
                  >
                    <span className='sidebar_item_icon'>{icon}</span>
                    <span className='sidebar_item_label'>{item.label}</span>
                  </button>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={`sidebar_item ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className='sidebar_item_icon'>{icon}</span>
                  <span className='sidebar_item_label'>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <PriceMasterModal isOpen={modal === 'price-master'} onClose={() => setModal(null)} />
      <PlatformFeeModal isOpen={modal === 'platform-fee'} onClose={() => setModal(null)} />
    </div>
  );
}
