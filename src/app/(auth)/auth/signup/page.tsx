'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import '../auth.css';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignUpPage() {
  // const router = useRouter();
  // const [isLoading, setIsLoading] = useState(false);
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [formData, setFormData] = useState<FormData>({
  //   email: '',
  //   password: '',
  //   confirmPassword: '',
  // });
  // const [errors, setErrors] = useState<FormErrors>({});
  // const validateForm = (): boolean => {
  //   const newErrors: FormErrors = {};
  //   if (!formData.email.trim()) {
  //     newErrors.email = 'Email is required';
  //   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  //     newErrors.email = 'Please enter a valid email address';
  //   }
  //   if (!formData.password) {
  //     newErrors.password = 'Password is required';
  //   } else if (formData.password.length < 8) {
  //     newErrors.password = 'Password must be at least 8 characters';
  //   }
  //   if (!formData.confirmPassword) {
  //     newErrors.confirmPassword = 'Please confirm your password';
  //   } else if (formData.password !== formData.confirmPassword) {
  //     newErrors.confirmPassword = 'Passwords do not match';
  //   }
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };
  // const handleInputChange = (field: keyof FormData, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  //   if (errors[field]) {
  //     setErrors(prev => ({ ...prev, [field]: undefined }));
  //   }
  // };
  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!validateForm()) return;
  //   setIsLoading(true);
  //   const { email, password } = formData;
  //   // ✅ Try to sign up directly with email redirect
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       emailRedirectTo: `${window.location.origin}/auth/signup-callback`,
  //     },
  //   });
  //   console.log('SignUp Response:', { data, error });
  //   if (error) {
  //     console.error('Signup error details:', error);
  //     if (error.message.includes('User already registered')) {
  //       setErrors({ email: 'An account with this email already exists.' });
  //     } else {
  //       setErrors({ general: error.message || 'Something went wrong' });
  //     }
  //     setIsLoading(false);
  //     return;
  //   }
  //   // Check if user was created but needs email confirmation
  //   if (data.user && !data.session) {
  //     console.log('User created, email confirmation required:', data.user);
  //     toast.success(
  //       'Signup successful! Please check your email to confirm your account.'
  //     );
  //     setIsLoading(false);
  //     router.push('/auth/login');
  //   } else if (data.user && data.session) {
  //     console.log('User created and auto-confirmed:', data.user);
  //     toast.success('Account created successfully!');
  //     setIsLoading(false);
  //     router.push('/dashboard');
  //   } else {
  //     console.error('Unexpected signup response:', data);
  //     setErrors({ general: 'Signup failed. Please try again.' });
  //     setIsLoading(false);
  //   }
  // };
  // const handleGoogleSignUp = async () => {
  //   setIsLoading(true);
  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider: 'google',
  //     options: {
  //       redirectTo: `${location.origin}/signup-callback`,
  //     },
  //   });
  //   if (error) {
  //     toast.error('Google sign-in failed: ' + error.message);
  //     setIsLoading(false);
  //   }
  // };
  // return (
  //   <div className='auth-container'>
  //     <div className='auth-card'>
  //       {/* Logo */}
  //       <div className='auth-logo'>
  //         <div className='auth-logo-image'>
  //           <Image
  //             src='/aapka-tourism-logo.png'
  //             alt='Proptz'
  //             width={120}
  //             height={120}
  //           />
  //         </div>
  //       </div>
  //       <div className='auth-tabs'>
  //         <div className='auth-tab-container'>
  //           <button className='auth-tab-button '>
  //             <Link href='/auth/login'>Login</Link>
  //           </button>
  //           <button className='auth-tab-button active'>
  //             <Link href='/auth/signup'>Signup</Link>
  //           </button>
  //         </div>
  //       </div>
  //       {/* Form */}
  //       <form onSubmit={handleSubmit} className='auth-form'>
  //         {errors.general && <div className='auth-error'>{errors.general}</div>}
  //         <div className='auth-field'>
  //           <label className='auth-label'>Email</label>
  //           <input
  //             type='email'
  //             value={formData.email}
  //             onChange={e => handleInputChange('email', e.target.value)}
  //             placeholder='name@example.com'
  //             className='auth-input'
  //             disabled={isLoading}
  //           />
  //           {errors.email && (
  //             <p className='auth-error-message'>{errors.email}</p>
  //           )}
  //         </div>
  //         <div className='auth-field'>
  //           <label className='auth-label'>Password</label>
  //           <div className='auth-input-container'>
  //             <input
  //               type={showPassword ? 'text' : 'password'}
  //               value={formData.password}
  //               onChange={e => handleInputChange('password', e.target.value)}
  //               placeholder='••••••••'
  //               className='auth-input password'
  //               disabled={isLoading}
  //             />
  //             <button
  //               type='button'
  //               onClick={() => setShowPassword(!showPassword)}
  //               className='auth-password-toggle'
  //               disabled={isLoading}
  //             >
  //               {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //             </button>
  //           </div>
  //           {errors.password && (
  //             <p className='auth-error-message'>{errors.password}</p>
  //           )}
  //         </div>
  //         <div className='auth-field confirm-password'>
  //           <label className='auth-label'>Confirm Password</label>
  //           <div className='auth-input-container'>
  //             <input
  //               type={showConfirmPassword ? 'text' : 'password'}
  //               value={formData.confirmPassword}
  //               onChange={e =>
  //                 handleInputChange('confirmPassword', e.target.value)
  //               }
  //               placeholder='••••••••'
  //               className='auth-input password'
  //               disabled={isLoading}
  //             />
  //             <button
  //               type='button'
  //               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  //               className='auth-password-toggle'
  //               disabled={isLoading}
  //             >
  //               {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //             </button>
  //           </div>
  //           {errors.confirmPassword && (
  //             <p className='auth-error-message'>{errors.confirmPassword}</p>
  //           )}
  //         </div>
  //         <button
  //           type='submit'
  //           disabled={isLoading}
  //           className='auth-submit-button'
  //         >
  //           {isLoading ? 'Creating Account...' : 'Create Account'}
  //         </button>
  //         {/* Social Signup Button */}
  //         <button
  //           type='button'
  //           className='auth-social-button'
  //           onClick={handleGoogleSignUp}
  //           disabled={isLoading}
  //         >
  //           <div className='auth-social-icon'>G</div>
  //           <span className='auth-social-text'>Continue with Google</span>
  //         </button>
  //         {/* Footer */}
  //         <p className='auth-footer'>
  //           Already have an account?{' '}
  //           <Link href='/auth/login' className='auth-footer-link'>
  //             Log in
  //           </Link>
  //         </p>
  //         <p className='auth-footer'>
  //           By signing up, you agree to our{' '}
  //           <span className='auth-footer-link'>Terms of Service</span> and{' '}
  //           <span className='auth-footer-link'>Privacy Policy</span>
  //         </p>
  //       </form>
  //     </div>
  //   </div>
  // );
  return <div className='auth-container'>signup</div>;
}
