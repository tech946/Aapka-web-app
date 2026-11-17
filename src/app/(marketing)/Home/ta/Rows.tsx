'use client';

import Link from 'next/link';
import Rail from '@/components/site/ta/Rail';
import { categorySlug } from '@/components/site/site-config';
import { LIMITED_DEALS, typeForCategory } from '@/config/holiday-types';
import {
  categoryHref,
  dealHref,
  durationLabel,
  formatAed,
  marinaFromPrice,
  packageHref,
  plainText,
  priceLabel,
  shortDate,
  startingPrice,
  useCategoryPackages,
  useHomeBlogs,
  useHomeCategories,
  useIsAgent,
  useLimitedTimeDeals,
  useMarinaPackages,
  type HomeCategory,
  type HomePackage,
} from '../home-data';
import { generateShortSlug } from '@/lib/utils';
import type { InterestsSection } from '@/content/home';
import { CardItem, Head, Section, SkeletonItems, TileItem } from './parts';

/* The card rows and tile rows of the Tripadvisor-style homepage. Every row
   reads live production data and hides itself when it has nothing. */

function fromPrice(pkg: HomePackage, isAgent: boolean): string {
  const label = priceLabel(pkg, isAgent);
  return startingPrice(pkg) != null ? `from ${label} per person` : label;
}

function metaLine(pkg: HomePackage): string | undefined {
  return pkg.with_visa ? 'Visa included' : undefined;
}

/* ------------------------------------------------ "Find holidays by interest" */

export function Interests({ content }: { content: InterestsSection }) {
  return (
    <Section label="Holidays by interest">
      <Head title={content.title} sub={content.subtitle} />
      <Rail label="Holiday types">
        {content.tiles.map((k) => (
          <TileItem key={k.label + k.href} href={k.href} img={k.image} label={k.label} pos={k.position} />
        ))}
      </Rail>
    </Section>
  );
}

/* ------------------------------------------------ one row per CRM category */

export function CategoryRow({ category, withSub = true }: { category: HomeCategory; withSub?: boolean }) {
  const isAgent = useIsAgent();
  const slug = categorySlug(category.name);
  const { packages, isLoading } = useCategoryPackages(slug);
  if (!isLoading && !packages.length) return null;
  const type = typeForCategory(slug, category.name);
  const sub = withSub ? type.tagline || plainText(category.description).slice(0, 90) : null;

  return (
    <Section label={type.label}>
      <Head title={type.label} sub={sub} />
      <Rail label={type.label}>
        {isLoading && !packages.length ? (
          <SkeletonItems />
        ) : (
          packages.map((p) => (
            <CardItem
              key={p.package_id}
              href={packageHref(p, category.name)}
              img={p.thumbnail_image}
              title={p.package_name}
              chip={durationLabel(p) || type.cardLabel}
              meta={metaLine(p)}
              price={fromPrice(p, isAgent)}
            />
          ))
        )}
      </Rail>
    </Section>
  );
}

/** Rows for categories[from, to). */
export function CategoryRows({ from, to }: { from: number; to?: number }) {
  const { categories } = useHomeCategories();
  return (
    <>
      {categories.slice(from, to).map((c, n) => (
        <CategoryRow key={c.id} category={c} withSub={(from + n) % 2 === 1} />
      ))}
    </>
  );
}

/* ------------------------------------------------ Marina cruises */

export function MarinaRow({ title, subtitle }: { title: string; subtitle: string }) {
  const { packages } = useMarinaPackages();
  if (!packages.length) return null;
  return (
    <Section label="Dubai Marina cruises">
      <Head title={title} sub={subtitle} />
      <Rail label="Marina cruises">
        {packages.map((p) => {
          const from = marinaFromPrice(p);
          return (
            <CardItem
              key={p.package_id}
              href={`/marina-cruise-dinner/${generateShortSlug(p.package_name, p.package_id)}`}
              img={p.thumbnail_image}
              title={p.package_name}
              chip="Cruise"
              price={from ? `from ${formatAed(from)} per person` : 'Price revealing soon'}
            />
          );
        })}
      </Rail>
    </Section>
  );
}

/* ------------------------------------------------ Limited time deals */

export function DealsRow({ title, subtitle }: { title: string; subtitle: string }) {
  const isAgent = useIsAgent();
  const { deals } = useLimitedTimeDeals();
  if (!deals.length) return null;
  return (
    <Section label={LIMITED_DEALS.label}>
      <Head title={title} sub={subtitle} />
      <Rail label={LIMITED_DEALS.label}>
        {deals.map((d) =>
          d.package ? (
            <CardItem
              key={d.id}
              href={dealHref(d.package)}
              img={d.package.thumbnail_image}
              title={d.package.package_name}
              chip={`Ends ${shortDate(d.end_date)}`}
              chipTone="deal"
              meta={durationLabel(d.package) || undefined}
              price={fromPrice(d.package, isAgent)}
            />
          ) : null,
        )}
      </Rail>
    </Section>
  );
}

/* ------------------------------------------------ "Iconic places" → categories as photo tiles */

function CategoryTile({ category }: { category: HomeCategory }) {
  const slug = categorySlug(category.name);
  const { packages } = useCategoryPackages(slug);
  const img = packages.find((p) => p.thumbnail_image)?.thumbnail_image;
  if (!packages.length) return null;
  return <TileItem href={categoryHref(category.name)} img={img} label={typeForCategory(slug, category.name).label} />;
}

export function CategoryTiles({ title }: { title: string }) {
  const { categories } = useHomeCategories();
  if (!categories.length) return null;
  return (
    <Section label="Holidays to explore">
      <Head title={title} />
      <Rail label="Holiday types">
        {categories.map((c) => (
          <CategoryTile key={c.id} category={c} />
        ))}
        <TileItem href="/holidays" img="/images/package-3.jpg" label="All Holidays" />
      </Rail>
    </Section>
  );
}

/* ------------------------------------------------ "Inspiration" band → blogs */

export function BlogBand({ title }: { title: string }) {
  const { blogs } = useHomeBlogs(10);
  if (!blogs.length) return null;
  return (
    <section className="ta-band" aria-label="Travel guides">
      <div className="ta-sec">
        <Head title={title} />
        <Rail label="Travel guides" wide>
          {blogs.map((b) => (
            <li className="ta-rail__item" key={b.id}>
              <Link href={`/blogs/${b.slug}`} className="ta-story">
                <span className="ta-story__media">
                  <img src={b.featured_image || '/images/package-1.png'} alt="" loading="lazy" />
                </span>
                <span className="ta-story__title">{b.title}</span>
              </Link>
            </li>
          ))}
        </Rail>
      </div>
    </section>
  );
}
