'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Link2, TrendingUp, Wallet } from 'lucide-react';
import { AuthField, AuthPassword, AuthShell, AuthSubmit, type AuthPerk } from '@/components/site/auth/AuthShell';

const PERKS: AuthPerk[] = [
  { icon: Link2, title: 'Your own package links', text: 'Share any Aapka holiday with your personal referral link.' },
  { icon: TrendingUp, title: 'Live earnings', text: 'See every booking and commission as it comes in.' },
  { icon: Wallet, title: 'Easy withdrawals', text: 'Request payouts from your wallet whenever you like.' },
];

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
    <AuthShell
      kicker="Aapka Influencer Portal"
      title="Welcome back, creator"
      text="Log in to share Aapka Tourism holidays with your audience and track what you earn from every booking."
      image="/images/stock/traveller-couple-dunes.jpg"
      perksTitle="Inside your portal"
      perks={PERKS}
      cardTitle="Influencer login"
      cardText="Use the email from your invite."
    >
      <form onSubmit={handleSubmit} className="xa-form" noValidate>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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
        Want to work with us? <Link href="/contact">Get in touch</Link>
      </p>
    </AuthShell>
  );
}
