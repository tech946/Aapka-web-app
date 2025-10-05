import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Explore Proptz...</h3>
        <p>turn referalls into real income.</p>
      </div>

      <div className='features_row'>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 33 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M16.4998 9.30762V18.6153M16.4998 18.6153L5.92285 25.3845M16.4998 18.6153L28.769 25.3845'
                stroke='#ff4d00'
                stroke-opacity='0.4'
                stroke-width='4'
              />
              <circle cx='16.0769' cy='5.92308' r='5.92308' fill='#ff4d00' />
              <circle cx='27.0769' cy='25.3845' r='5.92308' fill='#ff4d00' />
              <circle cx='5.92308' cy='25.3845' r='5.92308' fill='#ff4d00' />
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Leads <span className='badge'>New</span>
            </h4>
            <p>Manage and track all your leads efficiently.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              width='34'
              height='34'
              viewBox='0 0 34 34'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M9 24L13 7'
                stroke='#ff4d00'
                stroke-width='6'
                stroke-linecap='round'
              />
              <path
                d='M9.00014 23.9215L22.0325 12.2957'
                stroke='#ff4d00'
                stroke-width='6'
                stroke-linecap='round'
              />
              <path
                d='M8.99964 24.5561L26.2272 21.6906'
                stroke='#ff4d00'
                stroke-width='6'
                stroke-linecap='round'
              />
              <circle cx='9.5' cy='24.5' r='7.5' fill='#ff4d00' />
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Properties <span className='badge'>New</span>
            </h4>
            <p>Manage and track all your leads efficiently.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              width='34'
              height='34'
              viewBox='0 0 34 34'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <g clip-path='url(#clip0_2781_13948)'>
                <path
                  d='M29.722 16.7197C29.6694 16.4571 29.5432 16.215 29.3581 16.0215C29.1729 15.8281 28.9365 15.6914 28.6765 15.6274L18.9581 13.1964L22.5522 4.80836C22.6774 4.51728 22.7012 4.19257 22.6198 3.88634C22.5383 3.58012 22.3564 3.31013 22.1031 3.11969C21.8503 2.92801 21.5403 2.82711 21.2231 2.83327C20.906 2.83944 20.6001 2.95232 20.355 3.15369L4.77163 15.9037C4.56837 16.07 4.41532 16.2895 4.32958 16.5377C4.24384 16.7859 4.22879 17.0531 4.2861 17.3094C4.34341 17.5657 4.47083 17.801 4.65413 17.989C4.83744 18.1771 5.0694 18.3105 5.32413 18.3744L14.8427 20.7558L10.104 29.0489C9.98172 29.2644 9.91804 29.5081 9.91927 29.7558C9.92049 30.0035 9.98659 30.2466 10.111 30.4608C10.2353 30.675 10.4137 30.8529 10.6282 30.9768C10.8427 31.1007 11.0859 31.1662 11.3336 31.1669C11.6402 31.1674 11.9387 31.0679 12.1836 30.8835L29.1836 18.1335C29.3978 17.9728 29.562 17.7547 29.6573 17.5045C29.7526 17.2543 29.775 16.9821 29.722 16.7197Z'
                  fill='#ff4d00'
                />
              </g>
              <defs>
                <clipPath id='clip0_2781_13948'>
                  <rect width='34' height='34' fill='white' />
                </clipPath>
              </defs>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Payments <span className='badge'>New</span>
            </h4>
            <p>Manage and track all your leads efficiently.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              version='1.1'
              viewBox='0 0 55 77.3'
            >
              <defs></defs>

              <g>
                <g id='Layer_1' fill='#ff4d00'>
                  <circle className='cls-1' cx='8.3' cy='10.1' r='8.3' />
                  <circle className='cls-1' cx='45.9' cy='10.1' r='8.3' />
                  <path
                    fill='#ff4d00'
                    className='cls-1'
                    d='M11.6,77.3v-16c14.3,0,26-11.7,26-26v-8h16v8c0,23.2-18.8,42-42,42Z'
                  />
                </g>
              </g>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Queries <span className='badge'>New</span>
            </h4>
            <p>Manage and track all your leads efficiently.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
