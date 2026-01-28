'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import './subscribe.css';

export default function SubscribePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    residentCountry: '',
    mobileNumber: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    fullName?: string;
    residentCountry?: string;
    mobileNumber?: string;
  }>({});

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
          email: formData.email,
          fullName: formData.fullName,
          residentCountry: formData.residentCountry,
          mobileNumber: formData.mobileNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to CCAvenue payment page
      if (data.redirectUrl && data.encRequest && data.accessCode) {
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
        throw new Error('Invalid payment response');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to process subscription. Please try again.');
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
            <input
              type='text'
              id='residentCountry'
              value={formData.residentCountry}
              onChange={e => handleInputChange('residentCountry', e.target.value)}
              className={`subscribe-input ${errors.residentCountry ? 'error' : ''}`}
              placeholder='United Arab Emirates'
              disabled={isSubmitting}
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
