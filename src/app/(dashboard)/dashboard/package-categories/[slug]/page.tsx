import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import './styles.css';
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || '').toLowerCase();
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
      <CategoryPackagesClient
        categoryId={category.id}
        categorySlug={decoded}
        categoryName={category.name}
        title={category.name}
        subtitle='Packages in this category'
        actions={
          <AddPackageClient
            categoryId={category.id}
            categorySlug={decoded}
            categoryName={category.name}
          />
        }
      />

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
