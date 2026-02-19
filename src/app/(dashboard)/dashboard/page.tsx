import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Content Editor: redirect to blog management (their only access)
  const isContentEditor = await hasRoleId(session.user.id, RoleId.CONTENT_EDITOR);
  if (isContentEditor) {
    redirect('/dashboard/blog-management');
  }

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Dashboard</h3>
        <p>Quick access to key sections</p>
      </div>
      <div className='features_row' style={{ marginTop: 16 }}>
        <a href='/dashboard/offer-packages' className='features_col'>
          <div className='features_icon'>
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
              className='lucide lucide-package'
            >
              <path d='M16.5 9.4 7.55 4.24'></path>
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
              <polyline points='3.29 7 12 12 20.71 7'></polyline>
              <line x1='12' x2='12' y1='22' y2='12'></line>
            </svg>
          </div>
          <div className='features_content'>
            <h4>
              Offer Packages
              <span className='badge'>Go</span>
            </h4>
            <p>Create and manage promotional packages for users.</p>
          </div>
        </a>

        <a href='/dashboard/users' className='features_col'>
          <div className='features_icon'>
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
              className='lucide lucide-user'
            >
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
              <circle cx='12' cy='7' r='4'></circle>
            </svg>
          </div>
          <div className='features_content'>
            <h4>
              Users
              <span className='badge'>Go</span>
            </h4>
            <p>View and manage registered users and roles.</p>
          </div>
        </a>

        <a href='/dashboard/payments' className='features_col'>
          <div className='features_icon'>
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
              className='lucide lucide-credit-card'
            >
              <rect width='20' height='14' x='2' y='5' rx='2'></rect>
              <line x1='2' x2='22' y1='10' y2='10'></line>
            </svg>
          </div>
          <div className='features_content'>
            <h4>
              Payments
              <span className='badge'>Go</span>
            </h4>
            <p>Track and reconcile transactions and invoices.</p>
          </div>
        </a>
      </div>
    </div>
  );
}
