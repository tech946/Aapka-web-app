'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Optional: capture redirect from middleware (/login?redirect=/dashboard/settings)
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/dashboard';

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, redirectTo }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Logged in successfully!');
      router.refresh(); // refresh session state
      router.push(result.redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      toast.error(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClientComponentClient();

    const redirectTo = `${window.location.origin}/login-callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      toast.error('Google login failed');
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        {/* Logo */}
        <div className='auth-logo'>
          <div className='auth-logo-image'>
            <Image
              src='/proptz logo.png'
              alt='Proptz'
              width={120}
              height={120}
            />
          </div>
        </div>
        <div className='auth-tabs'>
          <div className='auth-tab-container'>
            <button className='auth-tab-button active'>
              <Link href='/auth/login'>Login</Link>
            </button>
            {/* <button className='auth-tab-button'>
              <Link href='/auth/signup'>Signup</Link>
            </button> */}
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className='auth-form'>
          {error && <div className='auth-error'>{error}</div>}

          <div className='auth-field'>
            <label className='auth-label'>Email</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='name@example.com'
              className='auth-input'
              disabled={isLoading}
            />
          </div>

          <div className='auth-field'>
            <label className='auth-label'>Password</label>
            <div className='auth-input-container'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='auth-input password'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='auth-password-toggle'
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='auth-submit-button'
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          {/* Social Login Button */}
          <button
            type='button'
            className='auth-social-button'
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <div className='auth-social-icon'>G</div>
            <span className='auth-social-text'>Continue with Google</span>
          </button>

          {/* Footer */}
          <p className='auth-footer'>
            Don't have an account?{' '}
            <Link href='/auth/signup' className='auth-footer-link'>
              Sign up
            </Link>
          </p>
          <p className='auth-footer'>
            Forgot your password?{' '}
            <Link href='/auth/forgetpassword' className='auth-footer-link'>
              Reset it here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
