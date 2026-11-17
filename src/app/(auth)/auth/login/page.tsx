'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Globe, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useUserStore } from '@/store/user-store';
import './crm-login.css';

/* Dashboard login — the CRM's two-step card (aapka-tourism-crm
   src/app/(auth)/auth/login): the email is checked first, and only a
   dashboard user is asked for a password. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'password';

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className='crm-login-inline-error' role='alert'>
      <AlertCircle size={15} aria-hidden />
      <span>{message}</span>
    </p>
  );
}

function StepBar({ filled }: { filled: 1 | 2 }) {
  return (
    <div className='crm-login-steps' aria-label={`Step ${filled} of 2`}>
      <span className='crm-login-step is-filled' />
      <span className={`crm-login-step${filled === 2 ? ' is-filled' : ''}`} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Move focus to whichever field the current step asks for.
  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
    else emailRef.current?.focus();
  }, [step]);

  /** Ask the server whether this email belongs to a dashboard user. */
  const verifyEmail = async (): Promise<boolean> => {
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return false;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('That doesn’t look like a valid email address.');
      return false;
    }

    setIsCheckingEmail(true);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const result = await res.json();

      if (!res.ok) {
        setEmailError(result.error || 'Could not verify email. Please try again.');
        return false;
      }
      if (!result.exists) {
        setEmailError('No account found with this email. Check the address or contact your admin.');
        return false;
      }
      if (result.access === false) {
        setEmailError('This account doesn’t have dashboard access. Please contact your admin.');
        return false;
      }
      return true;
    } catch {
      setEmailError('Could not verify email. Check your connection and try again.');
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError(null);
    setResetNotice(null);

    if (await verifyEmail()) {
      setEmail(email.trim());
      setStep('password');
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setPassword('');
    setPasswordError(null);
    setResetNotice(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setResetNotice(null);

    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Optional: capture redirect from middleware (/auth/login?redirect=/dashboard/...)
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/dashboard';

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirectTo }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Clear any stale user/role data from a previous account before redirect
      useUserStore.getState().clearUser();

      toast.success('Logged in successfully!');
      router.refresh();
      router.push(result.redirectTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setPasswordError(
        /invalid login credentials/i.test(message) ? 'Incorrect password. Please try again.' : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Email a password reset link (lands on /auth/updatepassword). */
  const handleUpdatePassword = async () => {
    setResetNotice(null);

    // On the email step the address has not been checked yet.
    if (step === 'email') {
      setEmailError(null);
      if (!(await verifyEmail())) return;
    }

    const target = email.trim();
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/auth/updatepassword`,
      });

      if (error) {
        const message = error.message || 'Could not send the link. Please try again.';
        if (step === 'email') setEmailError(message);
        else setPasswordError(message);
        return;
      }

      setPasswordError(null);
      setResetNotice(`We’ve emailed a password update link to ${target}.`);
    } catch {
      const message = 'Could not send the link. Check your connection and try again.';
      if (step === 'email') setEmailError(message);
      else setPasswordError(message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const isBusy = isCheckingEmail || isLoading || isSendingReset;

  return (
    <div className='crm-login-page'>
      <main className='crm-login-card'>
        <div className='crm-login-art'>
          <img src='/images/login-illustration.webp' alt='' width={1386} height={1136} />
        </div>

        <h1 className='crm-login-title'>Login to Aapka Tourism</h1>
        <p className='crm-login-subtitle'>
          Manage packages, bookings, enquiries and content — all in one place.
        </p>
        <StepBar filled={step === 'password' ? 2 : 1} />

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className='crm-login-form' noValidate>
            <div className={`crm-login-field${emailError ? ' has-error' : ''}`}>
              <Mail size={18} className='crm-login-field-icon' aria-hidden />
              <input
                ref={emailRef}
                type='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder='Email address'
                autoComplete='email'
                aria-label='Email address'
                aria-invalid={!!emailError}
                disabled={isBusy}
              />
            </div>
            <InlineError message={emailError} />

            <button type='submit' className='crm-login-primary' disabled={isBusy}>
              {isCheckingEmail ? 'Checking…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className='crm-login-form crm-login-form-enter' noValidate>
            <div className='crm-login-email-chip'>
              <Mail size={16} aria-hidden />
              <span className='crm-login-email-chip-text'>{email}</span>
              <button type='button' onClick={handleChangeEmail} disabled={isBusy}>
                <ArrowLeft size={14} aria-hidden />
                Change
              </button>
            </div>

            <div className={`crm-login-field${passwordError ? ' has-error' : ''}`}>
              <Lock size={18} className='crm-login-field-icon' aria-hidden />
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder='Password'
                autoComplete='current-password'
                aria-label='Password'
                aria-invalid={!!passwordError}
                disabled={isBusy}
              />
              <button
                type='button'
                className='crm-login-eye'
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <InlineError message={passwordError} />

            <button type='submit' className='crm-login-primary' disabled={isBusy}>
              {isLoading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        )}

        {resetNotice && (
          <p className='crm-login-notice' role='status'>
            <CheckCircle2 size={15} aria-hidden />
            <span>{resetNotice}</span>
          </p>
        )}

        <div className='crm-login-divider'>
          <span>or</span>
        </div>

        <Link href='/' className='crm-login-social'>
          <Globe size={18} aria-hidden />
          Back to the website
        </Link>

        <p className='crm-login-footer'>
          Forgot your password?{' '}
          <button type='button' onClick={handleUpdatePassword} disabled={isBusy}>
            {isSendingReset ? 'Sending link…' : 'Update password'}
          </button>
        </p>
      </main>
    </div>
  );
}
