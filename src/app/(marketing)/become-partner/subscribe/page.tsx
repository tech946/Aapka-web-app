'use client';

import { useState, FormEvent, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from '@/lib/supabase-storage';
import { COUNTRIES } from '@/lib/countries';
import { Check, Info, Loader2, Lock, Shield, Upload, X } from 'lucide-react';
import Select from '@/components/site/ui/Select';
import NavyHeader from '@/components/marketing/Header/NavyHeader';
import NavyFooter from '@/components/marketing/Footer/NavyFooter';
import { FR_FONTS } from '../../Home/foreigner/fonts';
import '../../Home/foreigner/foreigner.css';
import './subscribe.css';

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentImageUrl, setDocumentImageUrl] = useState<string>('');
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [showDocumentExamples, setShowDocumentExamples] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);
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
    documentImage?: string;
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

    if (!documentImageUrl.trim()) {
      newErrors.documentImage = 'Passport/PAN Card/Resident ID is required';
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
          documentImageUrl: documentImageUrl,
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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    setIsUploadingDocument(true);
    try {
      const url = await uploadImageToSupabase(file, 'agents');
      // Delete previous document from storage when replacing (scalability)
      if (documentImageUrl) {
        try {
          await deleteImageFromSupabase(documentImageUrl);
        } catch (e) {
          console.error(e);
        }
      }
      setDocumentImageUrl(url);
      toast.success('Document uploaded successfully');
      if (errors.documentImage) {
        setErrors(prev => ({ ...prev, documentImage: undefined }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload document'
      );
      setDocumentPreview('');
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleRemoveDocument = async () => {
    if (documentImageUrl) {
      try {
        await deleteImageFromSupabase(documentImageUrl);
      } catch (e) {
        console.error(e);
      }
    }
    setDocumentImageUrl('');
    setDocumentPreview('');
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
    setErrors(prev => ({ ...prev, documentImage: undefined }));
  };


  return (
    <SubscribeShell>
      <header className='sp-head'>
        <p className='sp-eyebrow'>Partner sign-up</p>
        <h1 className='sp-title'>Agent Registration</h1>
        <p className='sp-sub'>
          Fill in your details to complete your agent subscription
        </p>
      </header>

      <form onSubmit={handleSubmit} className='sp-card' noValidate>
        <div className='sp-plan'>
          <span className='sp-plan__icon' aria-hidden='true'>
            <Shield />
          </span>
          <div className='sp-plan__text'>
            <b>Aapka Partner Premium</b>
            <span>Instant activation after payment</span>
          </div>
          <p className='sp-plan__price'>
            AED 110 <small>/ year</small>
          </p>
        </div>

        <div className='sp-body'>
          {errors.general && (
            <p className='sp-alert' role='alert'>
              {errors.general}
            </p>
          )}

          <div className='sp-grid'>
            <div className='sp-field'>
              <label htmlFor='email' className='sp-label'>
                Email Address <em className='sp-req'>*</em>
              </label>
              <input
                type='email'
                id='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={'sp-input' + (errors.email ? ' is-error' : '')}
                placeholder='your.email@example.com'
                autoComplete='email'
                disabled={isSubmitting}
              />
              {errors.email && <p className='sp-error'>{errors.email}</p>}
            </div>

            <div className='sp-field'>
              <label htmlFor='fullName' className='sp-label'>
                Full Name <em className='sp-req'>*</em>
              </label>
              <input
                type='text'
                id='fullName'
                value={formData.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                className={'sp-input' + (errors.fullName ? ' is-error' : '')}
                placeholder='John Doe'
                autoComplete='name'
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className='sp-error'>{errors.fullName}</p>
              )}
            </div>

            <div className='sp-field'>
              <label htmlFor='residentCountry' className='sp-label'>
                Resident Country <em className='sp-req'>*</em>
              </label>
              <Select
                id='residentCountry'
                value={formData.residentCountry}
                onChange={value => handleInputChange('residentCountry', value)}
                options={COUNTRIES}
                placeholder='Select country'
                searchPlaceholder='Search countries…'
                disabled={isSubmitting}
                invalid={!!errors.residentCountry}
              />
              {errors.residentCountry && (
                <p className='sp-error'>{errors.residentCountry}</p>
              )}
            </div>

            <div className='sp-field'>
              <label htmlFor='mobileNumber' className='sp-label'>
                Mobile Number <em className='sp-req'>*</em>
              </label>
              <input
                type='tel'
                id='mobileNumber'
                value={formData.mobileNumber}
                onChange={e => handleInputChange('mobileNumber', e.target.value)}
                className={'sp-input' + (errors.mobileNumber ? ' is-error' : '')}
                placeholder='+971567809460'
                autoComplete='tel'
                disabled={isSubmitting}
              />
              {errors.mobileNumber && (
                <p className='sp-error'>{errors.mobileNumber}</p>
              )}
            </div>

            <div className='sp-field'>
              <label htmlFor='password' className='sp-label'>
                Password <em className='sp-req'>*</em>
              </label>
              <input
                type='password'
                id='password'
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className={'sp-input' + (errors.password ? ' is-error' : '')}
                placeholder='Min. 8 characters'
                autoComplete='new-password'
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className='sp-error'>{errors.password}</p>
              )}
            </div>

            <div className='sp-field'>
              <label htmlFor='confirmPassword' className='sp-label'>
                Confirm Password <em className='sp-req'>*</em>
              </label>
              <input
                type='password'
                id='confirmPassword'
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                className={'sp-input' + (errors.confirmPassword ? ' is-error' : '')}
                placeholder='Confirm your password'
                autoComplete='new-password'
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className='sp-error'>{errors.confirmPassword}</p>
              )}
            </div>

            <div className='sp-field sp-field--wide'>
              <div className='sp-label'>
                <label htmlFor='documentImage'>
                  Passport/PAN Card/Resident ID <em className='sp-req'>*</em>
                </label>
                <button
                  type='button'
                  onClick={() => setShowDocumentExamples(true)}
                  className='sp-info'
                  disabled={isSubmitting}
                >
                  <Info aria-hidden='true' />
                  See examples
                </button>
              </div>
              {!documentPreview ? (
                <label
                  htmlFor='documentImage'
                  className={
                    'sp-drop' +
                    (errors.documentImage ? ' is-error' : '') +
                    (isUploadingDocument ? ' is-uploading' : '')
                  }
                >
                  <input
                    ref={documentInputRef}
                    type='file'
                    id='documentImage'
                    accept='image/jpeg,image/jpg,image/png,image/webp'
                    onChange={handleDocumentUpload}
                    disabled={isSubmitting || isUploadingDocument}
                    className='sp-drop__input'
                  />
                  <span className='sp-drop__icon' aria-hidden='true'>
                    {isUploadingDocument ? <Loader2 className='sp-spin' /> : <Upload />}
                  </span>
                  <span className='sp-drop__text'>
                    {isUploadingDocument ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </span>
                  {isUploadingDocument ? null : (
                    <span className='sp-drop__hint'>PNG, JPG, WEBP up to 5MB</span>
                  )}
                </label>
              ) : (
                <div className='sp-preview'>
                  <div className='sp-preview__frame'>
                    <img src={documentPreview} alt='Document preview' />
                    <button
                      type='button'
                      onClick={handleRemoveDocument}
                      className='sp-preview__remove'
                      disabled={isSubmitting || isUploadingDocument}
                      aria-label='Remove document'
                    >
                      <X aria-hidden='true' />
                    </button>
                  </div>
                  <p className='sp-preview__ok'>
                    <Check aria-hidden='true' />
                    Document uploaded successfully
                  </p>
                </div>
              )}
              {errors.documentImage && (
                <p className='sp-error'>{errors.documentImage}</p>
              )}
            </div>
          </div>
        </div>

        <div className='sp-foot'>
          <p className='sp-secure'>
            <Lock aria-hidden='true' />
            Secure payment via CCAvenue
          </p>
          <button type='submit' disabled={isSubmitting} className='sp-btn'>
            {isSubmitting ? (
              <>
                <Loader2 className='sp-spin' aria-hidden='true' />
                Processing...
              </>
            ) : (
              'Proceed to Payment (110 AED)'
            )}
          </button>
        </div>
      </form>

      {showDocumentExamples && (
        <div className='sp-modal'>
          <div
            className='sp-modal__box'
            role='dialog'
            aria-modal='true'
            aria-labelledby='sp-modal-title'
            onClick={e => e.stopPropagation()}
          >
            <div className='sp-modal__head'>
              <h2 id='sp-modal-title' className='sp-modal__title'>
                Document Examples
              </h2>
              <button
                type='button'
                onClick={() => setShowDocumentExamples(false)}
                className='sp-modal__close'
                aria-label='Close modal'
              >
                <X aria-hidden='true' />
              </button>
            </div>
            <div className='sp-modal__body'>
              <p className='sp-modal__desc'>
                Please upload a clear image of one of the following documents:
              </p>
              <div className='sp-examples'>
                {DOCUMENT_EXAMPLES.map(doc => (
                  <div key={doc.title} className='sp-example'>
                    <h3 className='sp-example__title'>{doc.title}</h3>
                    <div className='sp-example__frame'>
                      <ExampleImage src={doc.src} alt={doc.title + ' example'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </SubscribeShell>
  );
}

const DOCUMENT_EXAMPLES = [
  { title: 'PAN Card', src: '/images/pan-card-sample.jpg' },
  { title: 'Aadhar Card', src: '/images/aadhar-card-sample.jpg' },
  { title: 'Resident ID', src: '/images/resident-id-sample.jpg' },
];

function ExampleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className='sp-example__missing'>Image not found</p>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

function SubscribeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={'fr ' + FR_FONTS}>
      <NavyHeader />
      <main className='sp-page'>
        <div className='sp-wrap'>{children}</div>
      </main>
      <NavyFooter />
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <SubscribeShell>
          <header className='sp-head'>
            <p className='sp-eyebrow'>Partner sign-up</p>
            <h1 className='sp-title'>Agent Registration</h1>
            <p className='sp-sub'>Loading...</p>
          </header>
        </SubscribeShell>
      }
    >
      <SubscribePageContent />
    </Suspense>
  );
}
