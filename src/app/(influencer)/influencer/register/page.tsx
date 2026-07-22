'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

function InfluencerRegisterForm() {
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
      <div className="rounded-2xl border bg-card p-8 text-center card-accent">
        <div className="animate-pulse text-muted-foreground flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-[#ff4c00]/30 animate-pulse" />
          Validating invitation...
        </div>
      </div>
    );
  }

  if (!tokenValid || !token) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center card-accent">
        <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠</span>
        </div>
        <h2 className="text-lg font-semibold text-destructive">Invalid or expired link</h2>
        <p className="text-muted-foreground mt-2">This invitation link is invalid or has expired.</p>
        <Link href="/influencer/login" className="mt-6 inline-flex items-center font-medium text-[#ff4c00] hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-lg card-accent">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[#ff4c00]/15 items-center justify-center mb-4">
          <span className="text-2xl font-bold text-[#ff4c00]">AT</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Complete Registration</h1>
        <p className="text-muted-foreground text-sm mt-1">Create your influencer account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password *</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-accent w-full py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/influencer/login" className="font-medium text-[#ff4c00] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function InfluencerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border bg-card p-8 text-center card-accent">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <InfluencerRegisterForm />
    </Suspense>
  );
}
