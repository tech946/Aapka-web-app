'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for URL fragments (access_token, etc.) from email confirmation
        const hash = window.location.hash;
        if (hash) {
          // Parse the hash parameters
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const tokenType = params.get('token_type');

          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Session error:', error);
              toast.error('Authentication failed.');
              router.push('/auth/signup');
              return;
            }

            if (data.session) {
              toast.success(
                'Email confirmed successfully! Welcome to Aapka Tourism!'
              );
              router.push('/dashboard');
              return;
            }
          }
        }

        // Fallback: try to get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error('Authentication failed.');
          router.push('/auth/signup');
          return;
        }

        const user = session.user;
        toast.success(
          'Email confirmed successfully! Welcome to Aapka Tourism!'
        );
        router.push('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('An error occurred during email confirmation.');
        router.push('/auth/signup');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className='flex justify-center items-center h-screen text-white'>
      Redirecting...
    </div>
  );
}
