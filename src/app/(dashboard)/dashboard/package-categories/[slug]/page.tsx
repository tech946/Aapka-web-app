import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import './styles.css';
// @ts-expect-error - next app dir client import
import AddPackageClient from './AddPackageClient';
import CategoryPackagesClient from './CategoryPackagesClient';

type Category = {
  id: string;
  name: string;
  created_at: string | null;
};

type Package = {
  package_id: string;
  package_name: string;
  package_price: number | null;
  package_description: string | null;
  created_at: string | null;
};

function slugToName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function CategoryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const decoded = decodeURIComponent(params.slug || '').toLowerCase();
  const candidateName = slugToName(decoded);

  // Find category by name (case-insensitive)
  const { data: categories, error: catError } = await supabaseAdmin
    .from('package_categories')
    .select('*')
    .ilike('name', candidateName);

  if (catError) {
    return (
      <div className='dashboard_page'>
        <div className='heading_block'>
          <h3>Category</h3>
          <p>Error: {catError.message}</p>
        </div>
      </div>
    );
  }

  const category: Category | undefined = Array.isArray(categories)
    ? (categories[0] as any)
    : undefined;

  if (!category) {
    return (
      <div className='dashboard_page'>
        <div className='heading_block'>
          <h3>Category not found</h3>
          <p>No category matches “{candidateName}”.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>{category.name}</h3>
        <p>Packages in this category</p>
      </div>

      <div className='table_toolbar category_toolbar'>
        <div />
        <div className='table_actions'>
          <AddPackageClient categoryId={category.id} />
        </div>
      </div>

      <CategoryPackagesClient categoryId={category.id} />

      <div className='table_pagination category_back_pagination'>
        <div />
        <div className='pagination_controls'>
          <Link href='/dashboard/package-categories'>
            <button>Back to categories</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
