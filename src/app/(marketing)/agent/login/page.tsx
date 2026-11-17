'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BadgePercent, Headphones, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AuthError, AuthField, AuthPassword, AuthShell, AuthSubmit, type AuthPerk } from '@/components/site/auth/AuthShell';

const PERKS: AuthPerk[] = [
  { icon: BadgePercent, title: 'Exclusive discounts', text: 'Partner prices on every holiday, tour and cruise.' },
  { icon: Headphones, title: 'Priority support', text: 'A direct line to our team in Dubai and Delhi.' },
  { icon: LayoutDashboard, title: 'Partner dashboard', text: 'Track bookings, payments and invoices in one place.' },
];

function AgentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      const statusResponse = await fetch(`/api/agent-subscription/check-status?email=${encodeURIComponent(email)}`);
      const statusData = await statusResponse.json();

      if (!statusData.hasSubscription || !statusData.isActive) {
        throw new Error('You do not have an active partner subscription. Please subscribe first.');
      }

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirectTo: '/agent/dashboard' }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Logged in successfully!');
      await queryClient.invalidateQueries({ queryKey: ['marketing', 'agent-status'] });
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

  return (
    <AuthShell
      kicker="Aapka Partner Portal"
      title="Welcome back, partner"
      text="Log in to book holidays for your clients at partner prices and manage every booking from your dashboard."
      image="/images/stock/banner-burj-palms.jpg"
      perksTitle="What you get as a partner"
      perks={PERKS}
      cardTitle="Partner login"
      cardText="For subscribed Aapka partners only."
    >
      <form onSubmit={handleSubmit} className="xa-form" noValidate>
        {error ? <AuthError>{error}</AuthError> : null}
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          disabled={isLoading}
        />
        <AuthPassword
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
        />
        <AuthSubmit busy={isLoading} label="Log in" busyLabel="Logging in…" />
      </form>
      <p className="xa-foot">
        Not a partner yet? <Link href="/become-partner">Become an Aapka Partner</Link>
      </p>
    </AuthShell>
  );
}

export default function AgentLoginPage() {
  return (
    <Suspense fallback={null}>
      <AgentLoginContent />
    </Suspense>
  );
}
