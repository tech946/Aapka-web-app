'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import './auth.css';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (activeTab === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/dashboard';

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          redirectTo,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Logged in successfully!');
      router.refresh();
      router.push(redirectTo);
    } catch (error: any) {
      setErrors({ general: error.message });
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup-callback`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Please check your email for verification link!');
      setFormData({ email: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      setErrors({ general: error.message });
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = activeTab === 'login' ? handleLogin : handleSignup;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

        {/* Tabs */}
        <div className='auth-tabs'>
          <div className='auth-tab-container'>
            <button
              type='button'
              onClick={() => setActiveTab('login')}
              className={`auth-tab-button ${activeTab === 'login' ? 'active' : ''}`}
            >
              Log In
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('signup')}
              className={`auth-tab-button signup ${activeTab === 'signup' ? 'active' : ''}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='auth-form'>
          {errors.general && <div className='auth-error'>{errors.general}</div>}

          <div className='auth-field'>
            <label className='auth-label'>Email</label>
            <input
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder='name@example.com'
              className='auth-input'
            />
            {errors.email && (
              <p className='auth-error-message'>{errors.email}</p>
            )}
          </div>

          <div className='auth-field'>
            <label className='auth-label'>Password</label>
            <div className='auth-input-container'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                placeholder='••••••••'
                className='auth-input password'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='auth-password-toggle'
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className='auth-error-message'>{errors.password}</p>
            )}
          </div>

          {activeTab === 'signup' && (
            <div className='auth-field confirm-password'>
              <label className='auth-label'>Confirm Password</label>
              <div className='auth-input-container'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword || ''}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  placeholder='••••••••'
                  className='auth-input password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='auth-password-toggle'
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='auth-error-message'>{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type='submit'
            disabled={isLoading}
            className='auth-submit-button'
          >
            {isLoading
              ? 'Loading...'
              : activeTab === 'login'
                ? 'Log In'
                : 'Create Account'}
          </button>

          {/* Social Login Buttons */}
          <button type='button' className='auth-social-button'>
            <div className='auth-social-icon'>G</div>
            <span className='auth-social-text'>Continue with Google</span>
            <span className='auth-social-subtext'>Last used</span>
          </button>

          {/* Footer */}
          <p className='auth-footer'>
            By signing up, you agree to our{' '}
            <span className='auth-footer-link'>Terms of Service</span> and{' '}
            <span className='auth-footer-link'>Privacy Policy</span>
          </p>
        </form>
      </div>
    </div>
  );
}
