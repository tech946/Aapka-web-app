'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InfluencerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/influencer-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Login failed');
      toast.success('Logged in successfully');
      router.refresh();
      router.push('/influencer/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-lg card-accent">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[#ff4c00]/15 items-center justify-center mb-4">
          <span className="text-2xl font-bold text-[#ff4c00]">AT</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Influencer Portal</h1>
        <p className="text-muted-foreground text-sm mt-1">Log in to your account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-accent w-full py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Not an influencer?{' '}
        <Link href="/" className="font-medium text-[#ff4c00] hover:underline">
          Go to main site
        </Link>
      </p>
    </div>
  );
}
