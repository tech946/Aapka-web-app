'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Badge, PageHeader } from '@/components/dashboard/kit';
import { useAccess } from '@/hooks/use-access';
import { errorMessage } from '@/lib/api/client';
import { PERMISSIONS } from '@/lib/access';
import { useSeoCatalog } from '../hooks';
import { SeoEditor } from './SeoEditor';
import './seo-page.css';

const GROUP_ORDER = ['Main pages', 'Forms & services', 'Policies', 'Packages', 'Marina cruises', 'Limited time deals'];

export function SeoPage() {
  const { can } = useAccess();
  const canWrite = can(PERMISSIONS.CMS_WRITE);
  const { data, isLoading, error } = useSeoCatalog();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>('/');

  const items = useMemo(() => data?.items ?? [], [data]);
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? items.filter((i) => `${i.label} ${i.path}`.toLowerCase().includes(q)) : items;
    return GROUP_ORDER.map((group) => ({ group, items: filtered.filter((i) => i.group === group) })).filter((g) => g.items.length);
  }, [items, search]);

  const page = items.find((i) => i.key === selected) ?? items[0];
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['Main pages']));
  const searching = search.trim() !== '';
  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  return (
    <div className='dashboard_page dk-seo'>
      <PageHeader title='SEO & Schema' description='Meta title, description and JSON-LD schema for every page of the website. Blog posts have their own SEO inside each post.' />

      {data && !data.tableReady && (
        <p className='dk-notice'>The page_seo table is not set up yet. Run docs/page-seo.sql in Supabase, then reload this page.</p>
      )}
      {error && <p className='dk-notice dk-notice--error'>{errorMessage(error)}</p>}

      <div className='dk-seo__grid'>
        <aside className='dk-card dk-seo__list'>
          <label className='dk-seo__search'>
            <Search size={14} aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search pages' aria-label='Search pages' />
          </label>
          {isLoading && <p className='dk-muted'>Loading pages…</p>}
          {groups.map((g) => {
            const open = searching || openGroups.has(g.group);
            const edited = g.items.filter((i) => i.customized).length;
            return (
              <div key={g.group} className={'dk-seo__group' + (open ? ' is-open' : '')}>
                <button type='button' className='dk-seo__group-head' onClick={() => toggleGroup(g.group)} aria-expanded={open}>
                  <span className='dk-seo__group-name'>{g.group}</span>
                  {edited > 0 && <span className='dk-seo__group-edited'>{edited} edited</span>}
                  <span className='dk-seo__group-count'>{g.items.length}</span>
                  <ChevronDown size={15} className='dk-seo__group-chev' aria-hidden />
                </button>
                {open && (
                  <ul>
                    {g.items.map((item) => (
                      <li key={item.key}>
                        <button
                          type='button'
                          className={'dk-seo__item' + (page?.key === item.key ? ' is-active' : '')}
                          onClick={() => setSelected(item.key)}
                          title={item.label}
                        >
                          <span className='dk-seo__item-label'>{item.label}</span>
                          {item.customized && <Badge tone='success'>{item.blockCount ? `${item.blockCount} schema` : 'Meta'}</Badge>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        {page ? <SeoEditor key={page.key} page={page} canWrite={canWrite && Boolean(data?.tableReady)} /> : null}
      </div>
    </div>
  );
}
