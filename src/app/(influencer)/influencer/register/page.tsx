'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InfluencerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`/api/influencer-portal/validate-token?token=${token}`)
      .then(res => res.json())
      .then(json => setTokenValid(!!json.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid invitation link');
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/influencer-portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: phone.trim() || undefined,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Registration failed');
      toast.success('Account created! Redirecting...');
      router.refresh();
      router.push('/influencer/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <div className="animate-pulse text-muted-foreground">Validating invitation...</div>
      </div>
    );
  }

  if (!tokenValid || !token) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Invalid or expired link</h2>
        <p className="text-muted-foreground mt-2">This invitation link is invalid or has expired.</p>
        <Link href="/influencer/login" className="mt-4 inline-block text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">Complete Registration</h1>
        <p className="text-muted-foreground text-sm mt-1">Create your influencer account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            disabled={isLoading}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/influencer/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
