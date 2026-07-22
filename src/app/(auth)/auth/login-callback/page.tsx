'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/user-store';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClientComponentClient();

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error('Login failed. Try again.');
        router.replace('/login');
        return;
      }

      // Clear any stale user/role data from previous account before redirect
      useUserStore.getState().clearUser();

      const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';
      router.replace(redirectedFrom);
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className='text-white text-center min-h-screen flex items-center justify-center'>
      Redirecting...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='text-white text-center min-h-screen flex items-center justify-center'>
          Loading...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
