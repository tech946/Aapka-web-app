'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Shield, Users, Star, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import './auth.css';

function AgentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/error messages from URL params
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const emailParam = searchParams.get('email');

    if (success === 'subscription_completed' && emailParam) {
      toast.success('Subscription completed! Please set your password to login.');
      setEmail(emailParam);
    }

    if (errorParam) {
      if (errorParam === 'payment_success') {
        toast.success('Payment successful! Please login with your email.');
      } else if (errorParam === 'user_creation_failed') {
        toast.error('Account created but login setup failed. Please contact support.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      // First check if user has active agent subscription
      const statusResponse = await fetch(
        `/api/agent-subscription/check-status?email=${encodeURIComponent(email)}`
      );
      const statusData = await statusResponse.json();

      if (!statusData.hasSubscription || !statusData.isActive) {
        throw new Error('You do not have an active partner subscription. Please subscribe first.');
      }

      // Try to login
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, redirectTo: '/agent/dashboard' }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Logged in successfully!');
      router.refresh();
      router.push('/agent/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/agent/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  return (
    <div className='auth-container agent-login-container'>
      <div className='auth-card agent-login-card'>
        {/* Agent Portal Badge */}
        <div className='agent-portal-badge'>
          <Shield size={20} className='agent-badge-icon' />
          <span>AAPKA PARTNER PORTAL</span>
        </div>

        {/* Logo */}
        <div className='auth-logo'>
          <div className='auth-logo-image'>
            <Image
              src='/aapka-tourism-logo.png'
              alt='Aapka Tourism'
              width={120}
              height={120}
            />
          </div>
        </div>

        {/* Partner Only Notice */}
        <div className='agent-exclusive-notice'>
          <Lock size={16} />
          <span>Exclusive access for subscribed partners only</span>
        </div>

        {/* Partner Benefits Preview */}
        <div className='agent-benefits-preview'>
          <div className='benefit-item'>
            <Star size={14} />
            <span>Exclusive Discounts</span>
          </div>
          <div className='benefit-item'>
            <Star size={14} />
            <span>Priority Support</span>
          </div>
          <div className='benefit-item'>
            <Star size={14} />
            <span>Partner Dashboard</span>
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

          {/* Footer */}
          <p className='auth-footer'>
            Don't have an partner account?{' '}
            <Link href='/become-agent' className='auth-footer-link'>
              Become a Aapka Partner
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AgentLoginPage() {
  return (
    <Suspense fallback={null}>
      <AgentLoginContent />
    </Suspense>
  );
}
