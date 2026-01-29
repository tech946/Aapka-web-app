'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CountrySelect } from '@/components/ui/country-select';
import './subscribe.css';

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    residentCountry: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    fullName?: string;
    residentCountry?: string;
    mobileNumber?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Check for error messages from URL params (from payment callback)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const reasonParam = searchParams.get('reason');
    
    if (errorParam) {
      let errorMessage = 'Payment processing failed. Please try again.';
      
      switch (errorParam) {
        case 'payment_failed':
          errorMessage = reasonParam 
            ? `Payment was not successful: ${decodeURIComponent(reasonParam)}. Please try again or contact support.`
            : 'Payment was not successful. Please try again or contact support.';
          break;
        case 'payment_cancelled':
          errorMessage = 'Payment was cancelled. You can try again when ready.';
          break;
        case 'payment_processing_failed':
          errorMessage = 'Payment processing failed. Please contact support.';
          break;
        case 'invalid_payment_data':
          errorMessage = 'Invalid payment data received. Please contact support.';
          break;
        case 'missing_user_data':
          errorMessage = 'User data missing. Please contact support.';
          break;
        case 'subscription_creation_failed':
          errorMessage = 'Subscription creation failed. Please contact support.';
          break;
        case 'user_creation_failed':
          errorMessage = 'Account creation failed. Please contact support.';
          break;
        case 'agent_creation_failed':
          errorMessage = 'Agent registration failed. Please contact support.';
          break;
        default:
          errorMessage = 'An error occurred. Please try again or contact support.';
      }
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.residentCountry.trim()) {
      newErrors.residentCountry = 'Resident country is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agent-subscription/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          residentCountry: formData.residentCountry.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error message from API
        const errorMessage = data.error || 'Failed to create payment';
        const errorDetails = data.details ? ` (${data.details})` : '';
        console.error('API Error:', { status: response.status, error: data });
        toast.error(`${errorMessage}${errorDetails}`);
        setIsSubmitting(false);
        return;
      }

      // Redirect to CCAvenue payment page
      if (data.redirectUrl && data.encRequest && data.accessCode) {
        toast.success('Redirecting to payment gateway...');
        // Create a form and submit it to CCAvenue
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.redirectUrl;

        const encRequestInput = document.createElement('input');
        encRequestInput.type = 'hidden';
        encRequestInput.name = 'encRequest';
        encRequestInput.value = data.encRequest;
        form.appendChild(encRequestInput);

        const accessCodeInput = document.createElement('input');
        accessCodeInput.type = 'hidden';
        accessCodeInput.name = 'access_code';
        accessCodeInput.value = data.accessCode;
        form.appendChild(accessCodeInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        console.error('Invalid payment response:', data);
        toast.error('Invalid payment response. Please try again or contact support.');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error.message || 'Failed to process subscription. Please try again.';
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className='subscribe-page'>
      <div className='subscribe-container'>
        <div className='subscribe-header'>
          <h1 className='subscribe-title'>Agent Registration</h1>
          <p className='subscribe-subtitle'>
            Fill in your details to complete your agent subscription
          </p>
        </div>

        <form onSubmit={handleSubmit} className='subscribe-form'>
          {errors.general && (
            <div className='subscribe-error-general' style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {errors.general}
            </div>
          )}
          <div className='subscribe-form-group'>
            <label htmlFor='email' className='subscribe-label'>
              Email Address <span className='required'>*</span>
            </label>
            <input
              type='email'
              id='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className={`subscribe-input ${errors.email ? 'error' : ''}`}
              placeholder='your.email@example.com'
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className='subscribe-error'>{errors.email}</p>
            )}
          </div>

          <div className='subscribe-form-group'>
            <label htmlFor='fullName' className='subscribe-label'>
              Full Name <span className='required'>*</span>
            </label>
            <input
              type='text'
              id='fullName'
              value={formData.fullName}
              onChange={e => handleInputChange('fullName', e.target.value)}
              className={`subscribe-input ${errors.fullName ? 'error' : ''}`}
              placeholder='John Doe'
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className='subscribe-error'>{errors.fullName}</p>
            )}
          </div>

          <div className='subscribe-form-group'>
            <label htmlFor='residentCountry' className='subscribe-label'>
              Resident Country <span className='required'>*</span>
            </label>
            <CountrySelect
              value={formData.residentCountry}
              onChange={value => handleInputChange('residentCountry', value)}
              placeholder='Select country'
              disabled={isSubmitting}
              error={!!errors.residentCountry}
            />
            {errors.residentCountry && (
              <p className='subscribe-error'>{errors.residentCountry}</p>
            )}
          </div>

          <div className='subscribe-form-group'>
            <label htmlFor='mobileNumber' className='subscribe-label'>
              Mobile Number <span className='required'>*</span>
            </label>
            <input
              type='tel'
              id='mobileNumber'
              value={formData.mobileNumber}
              onChange={e => handleInputChange('mobileNumber', e.target.value)}
              className={`subscribe-input ${errors.mobileNumber ? 'error' : ''}`}
              placeholder='+971567809460'
              disabled={isSubmitting}
            />
            {errors.mobileNumber && (
              <p className='subscribe-error'>{errors.mobileNumber}</p>
            )}
          </div>

          <div className='subscribe-form-group'>
            <label htmlFor='password' className='subscribe-label'>
              Password <span className='required'>*</span>
            </label>
            <input
              type='password'
              id='password'
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              className={`subscribe-input ${errors.password ? 'error' : ''}`}
              placeholder='Enter your password (min. 8 characters)'
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className='subscribe-error'>{errors.password}</p>
            )}
          </div>

          <div className='subscribe-form-group'>
            <label htmlFor='confirmPassword' className='subscribe-label'>
              Confirm Password <span className='required'>*</span>
            </label>
            <input
              type='password'
              id='confirmPassword'
              value={formData.confirmPassword}
              onChange={e => handleInputChange('confirmPassword', e.target.value)}
              className={`subscribe-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder='Confirm your password'
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className='subscribe-error'>{errors.confirmPassword}</p>
            )}
          </div>

          <div className='subscribe-form-actions'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='subscribe-submit-btn'
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Payment (110 AED)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className='subscribe-page'>
        <div className='subscribe-container'>
          <div className='subscribe-header'>
            <h1 className='subscribe-title'>Agent Registration</h1>
            <p className='subscribe-subtitle'>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SubscribePageContent />
    </Suspense>
  );
}
