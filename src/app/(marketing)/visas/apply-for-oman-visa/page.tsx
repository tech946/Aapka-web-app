'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, FileText, Camera, Upload, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { CountrySelect } from '@/components/ui/country-select';
import './oman-visa.css';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/jpg,image/png,image/webp';
const ACCEPTED_DOC_TYPES =
  'image/jpeg,image/jpg,image/png,image/webp,application/pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VISA_FEE_AED = 1; // Testing: use 1 AED (0.01 often rejected); normally 150

const PURPOSE_OPTIONS = [
  { value: 'Tourism', label: 'Tourism' },
  { value: 'Business', label: 'Business' },
  { value: 'Family Visit', label: 'Family Visit' },
];

const ERROR_MESSAGES: Record<string, string> = {
  payment_failed: 'Payment was not successful. Please try again.',
  payment_cancelled: 'Payment was cancelled.',
  payment_save_failed:
    'Payment succeeded but we could not save your application. Please contact us.',
  payment_processing_failed: 'Payment processing failed. Please try again.',
};

function OmanVisaApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    full_name_as_per_passport: '',
    nationality: '',
    contact_number: '',
    email: '',
    expected_travel_date: '',
    purpose_of_visit: '',
    duration_of_stay: '',
  });
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null);
  const [passportInsideFile, setPassportInsideFile] = useState<File | null>(
    null
  );
  const [photographFile, setPhotographFile] = useState<File | null>(null);
  const [declaration1, setDeclaration1] = useState(false);
  const [declaration2, setDeclaration2] = useState(false);
  const [declaration3, setDeclaration3] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err && ERROR_MESSAGES[err]) {
      toast.error(ERROR_MESSAGES[err]);
      router.replace('/visas/apply-for-oman-visa', { scroll: false });
    }
  }, [searchParams, router]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name_as_per_passport.trim())
      newErrors.full_name_as_per_passport = 'Required';
    if (!formData.nationality.trim()) newErrors.nationality = 'Required';
    if (!formData.contact_number.trim()) newErrors.contact_number = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email';
    if (!formData.expected_travel_date.trim())
      newErrors.expected_travel_date = 'Required';
    if (!formData.purpose_of_visit.trim())
      newErrors.purpose_of_visit = 'Required';
    if (!formData.duration_of_stay.trim())
      newErrors.duration_of_stay = 'Required';

    if (!passportFrontFile)
      newErrors.passport_front = 'Passport front page is required';
    else if (passportFrontFile.size > MAX_FILE_SIZE)
      newErrors.passport_front = 'Max 5MB';
    if (!passportInsideFile)
      newErrors.passport_inside = 'Passport inside page is required';
    else if (passportInsideFile.size > MAX_FILE_SIZE)
      newErrors.passport_inside = 'Max 5MB';
    if (!photographFile) newErrors.photograph = 'Photograph is required';
    else if (photographFile.size > MAX_FILE_SIZE)
      newErrors.photograph = 'Max 5MB';

    if (!declaration1 || !declaration2 || !declaration3)
      newErrors.declaration = 'You must accept all declarations';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fill all required fields and accept the declaration');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([k, v]) =>
        submitData.append(k, v.trim())
      );
      submitData.append('declaration_accepted', 'true');
      submitData.append('passport_front', passportFrontFile!);
      submitData.append('passport_inside', passportInsideFile!);
      submitData.append('photograph', photographFile!);

      const response = await fetch('/api/payments/oman-visa/create-order', {
        method: 'POST',
        body: submitData,
      });

      let data: {
        success?: boolean;
        error?: string;
        redirectUrl?: string;
        encRequest?: string;
        accessCode?: string;
      } = {};
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          'Server returned an invalid response. Please try again.'
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare payment');
      }

      if (
        !data.success ||
        !data.redirectUrl ||
        !data.encRequest ||
        !data.accessCode
      ) {
        throw new Error('Invalid payment response');
      }

      toast.success('Redirecting to payment...');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.redirectUrl;
      const fields = {
        encRequest: data.encRequest,
        access_code: data.accessCode,
      };
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error submitting Oman visa application:', err);
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className='oman-visa-page'>
      <div className='oman-visa-container'>
        {/* Header / Introduction */}
        <div className='oman-visa-header'>
          <h1 className='oman-visa-title'>
            Apply for Oman Tourist Visa – 24 Hours Processing
          </h1>
          <p className='oman-visa-intro'>
            Apply for your Oman Visa online in just a few simple steps. Fast
            processing, secure submission, and professional assistance.
          </p>
        </div>

        {/* Important Information */}
        <div className='oman-visa-info-box'>
          <h3>Important Information</h3>
          <p className='oman-visa-indian-only'>
            <strong>For Indian passport holders only</strong>
          </p>
          <ul>
            <li>
              <strong>Visa Processing Time:</strong> 24 Hours(May take more,
              depends on immigration)
            </li>
            <li>
              <strong>Visa Fees:</strong> {VISA_FEE_AED} AED
            </li>
            <li>
              <strong>Payment Type:</strong> Non-Refundable
            </li>
            <li>
              <strong>Visa Approval:</strong> Subject to Oman Immigration
              Approval
            </li>
            <li>
              <strong>Processing Mode:</strong> Online Application Only
            </li>
          </ul>
          <p className='oman-visa-note'>
            Visa approval or rejection is solely at the discretion of Oman
            Immigration Authorities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='oman-visa-form'>
          {/* A. Personal Details */}
          <div className='oman-visa-section'>
            <h3 className='oman-visa-section-title'>A. Personal Details</h3>
            <div className='oman-visa-form-grid'>
              <div className='oman-visa-form-group full-width'>
                <label>
                  Full Name (As per Passport){' '}
                  <span className='required'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.full_name_as_per_passport}
                  onChange={e =>
                    handleInputChange(
                      'full_name_as_per_passport',
                      e.target.value
                    )
                  }
                  placeholder='As per passport'
                  className={errors.full_name_as_per_passport ? 'error' : ''}
                />
                {errors.full_name_as_per_passport && (
                  <p className='oman-visa-error'>
                    {errors.full_name_as_per_passport}
                  </p>
                )}
              </div>
              <div className='oman-visa-form-group'>
                <label>
                  Nationality <span className='required'>*</span>
                </label>
                <CountrySelect
                  value={formData.nationality}
                  onChange={value => handleInputChange('nationality', value)}
                  placeholder='Select nationality'
                  error={!!errors.nationality}
                  className='oman-visa-country-select'
                />
                {errors.nationality && (
                  <p className='oman-visa-error'>{errors.nationality}</p>
                )}
              </div>
              <div className='oman-visa-form-group'>
                <label>
                  Contact Number (WhatsApp Preferred){' '}
                  <span className='required'>*</span>
                </label>
                <input
                  type='tel'
                  value={formData.contact_number}
                  onChange={e =>
                    handleInputChange('contact_number', e.target.value)
                  }
                  placeholder='+971...'
                  className={errors.contact_number ? 'error' : ''}
                />
                {errors.contact_number && (
                  <p className='oman-visa-error'>{errors.contact_number}</p>
                )}
              </div>
              <div className='oman-visa-form-group'>
                <label>
                  Email Address <span className='required'>*</span>
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='your@email.com'
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <p className='oman-visa-error'>{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* B. Travel Details */}
          <div className='oman-visa-section'>
            <h3 className='oman-visa-section-title'>B. Travel Details</h3>
            <div className='oman-visa-form-grid'>
              <div className='oman-visa-form-group'>
                <label>
                  Expected Date of Travel <span className='required'>*</span>
                </label>
                <input
                  type='date'
                  value={formData.expected_travel_date}
                  onChange={e =>
                    handleInputChange('expected_travel_date', e.target.value)
                  }
                  className={errors.expected_travel_date ? 'error' : ''}
                />
                {errors.expected_travel_date && (
                  <p className='oman-visa-error'>
                    {errors.expected_travel_date}
                  </p>
                )}
              </div>
              <div className='oman-visa-form-group'>
                <label>
                  Purpose of Visit <span className='required'>*</span>
                </label>
                <select
                  value={formData.purpose_of_visit}
                  onChange={e =>
                    handleInputChange('purpose_of_visit', e.target.value)
                  }
                  className={errors.purpose_of_visit ? 'error' : ''}
                >
                  <option value=''>Select</option>
                  {PURPOSE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.purpose_of_visit && (
                  <p className='oman-visa-error'>{errors.purpose_of_visit}</p>
                )}
              </div>
              <div className='oman-visa-form-group'>
                <label>
                  Duration of Stay <span className='required'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.duration_of_stay}
                  onChange={e =>
                    handleInputChange('duration_of_stay', e.target.value)
                  }
                  placeholder='e.g. 7 days'
                  className={errors.duration_of_stay ? 'error' : ''}
                />
                {errors.duration_of_stay && (
                  <p className='oman-visa-error'>{errors.duration_of_stay}</p>
                )}
              </div>
            </div>
          </div>

          {/* C. Document Upload */}
          <div className='oman-visa-section'>
            <h3 className='oman-visa-section-title'>
              C. Document Upload (Mandatory)
            </h3>
            <p className='oman-visa-doc-hint'>
              Please upload clear copies. Format: JPG / PNG / PDF • Max 5 MB per
              file
            </p>
            <div className='oman-visa-docs-grid'>
              <div className='oman-visa-doc-group'>
                <label>
                  <FileText size={16} /> Passport Front Page{' '}
                  <span className='required'>*</span>
                </label>
                <div className='oman-visa-file-wrap'>
                  <input
                    type='file'
                    accept={ACCEPTED_DOC_TYPES}
                    onChange={e =>
                      setPassportFrontFile(e.target.files?.[0] || null)
                    }
                    className='oman-visa-file-input'
                  />
                  <div className='oman-visa-file-display'>
                    {passportFrontFile ? (
                      <span className='oman-visa-file-name'>
                        {passportFrontFile.name}
                      </span>
                    ) : (
                      <span className='oman-visa-file-placeholder'>
                        <Upload size={18} /> Click to upload
                      </span>
                    )}
                  </div>
                </div>
                {errors.passport_front && (
                  <p className='oman-visa-error'>{errors.passport_front}</p>
                )}
              </div>
              <div className='oman-visa-doc-group'>
                <label>
                  <FileText size={16} /> Passport Inside Page{' '}
                  <span className='required'>*</span>
                </label>
                <div className='oman-visa-file-wrap'>
                  <input
                    type='file'
                    accept={ACCEPTED_DOC_TYPES}
                    onChange={e =>
                      setPassportInsideFile(e.target.files?.[0] || null)
                    }
                    className='oman-visa-file-input'
                  />
                  <div className='oman-visa-file-display'>
                    {passportInsideFile ? (
                      <span className='oman-visa-file-name'>
                        {passportInsideFile.name}
                      </span>
                    ) : (
                      <span className='oman-visa-file-placeholder'>
                        <Upload size={18} /> Click to upload
                      </span>
                    )}
                  </div>
                </div>
                {errors.passport_inside && (
                  <p className='oman-visa-error'>{errors.passport_inside}</p>
                )}
              </div>
              <div className='oman-visa-doc-group'>
                <label>
                  <Camera size={16} /> Passport Photo (White BG){' '}
                  <span className='required'>*</span>
                </label>
                <div className='oman-visa-file-wrap'>
                  <input
                    type='file'
                    accept={ACCEPTED_IMAGE_TYPES}
                    onChange={e =>
                      setPhotographFile(e.target.files?.[0] || null)
                    }
                    className='oman-visa-file-input'
                  />
                  <div className='oman-visa-file-display'>
                    {photographFile ? (
                      <span className='oman-visa-file-name'>
                        {photographFile.name}
                      </span>
                    ) : (
                      <span className='oman-visa-file-placeholder'>
                        <Upload size={18} /> Click to upload
                      </span>
                    )}
                  </div>
                </div>
                {errors.photograph && (
                  <p className='oman-visa-error'>{errors.photograph}</p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Payment Section */}
          <div className='oman-visa-section oman-visa-payment-box'>
            <h3 className='oman-visa-section-title'>4. Payment</h3>
            <p className='oman-visa-fee'>
              Visa Processing Fees: <strong>{VISA_FEE_AED} AED</strong>{' '}
              (Non-Refundable)
            </p>
            <ul>
              <li>Payment Mode: Online Payment Gateway / Bank Transfer</li>
              <li>
                Application will be processed only after payment confirmation
              </li>
            </ul>
          </div>

          {/* 5. Terms & Conditions */}
          <div className='oman-visa-section oman-visa-tnc'>
            <h3 className='oman-visa-section-title'>5. Terms & Conditions</h3>
            <ol>
              <li>
                Visa approval is subject to Oman Immigration rules and
                regulations.
              </li>
              <li>
                Visa fees ({VISA_FEE_AED} AED) are strictly non-refundable, even in case of
                rejection.
              </li>
              <li>
                Processing time is approximately 24 hours after submission of
                complete documents and payment confirmation.
              </li>
              <li>Applicant must ensure all documents are clear and valid.</li>
              <li>
                Incorrect or incomplete information may result in delay or
                rejection.
              </li>
              <li>
                The company is not responsible for visa rejection by Oman
                Immigration.
              </li>
            </ol>
          </div>

          {/* 6. Declaration */}
          <div className='oman-visa-section oman-visa-declaration'>
            <h3 className='oman-visa-section-title'>6. Declaration</h3>
            <label className='oman-visa-checkbox'>
              <input
                type='checkbox'
                checked={declaration1}
                onChange={e => {
                  setDeclaration1(e.target.checked);
                  if (errors.declaration)
                    setErrors(p => {
                      const n = { ...p };
                      delete n.declaration;
                      return n;
                    });
                }}
              />
              <span>
                I confirm that all the information provided is true and correct.
              </span>
            </label>
            <label className='oman-visa-checkbox'>
              <input
                type='checkbox'
                checked={declaration2}
                onChange={e => {
                  setDeclaration2(e.target.checked);
                  if (errors.declaration)
                    setErrors(p => {
                      const n = { ...p };
                      delete n.declaration;
                      return n;
                    });
                }}
              />
              <span>I understand that the visa fee is non-refundable.</span>
            </label>
            <label className='oman-visa-checkbox'>
              <input
                type='checkbox'
                checked={declaration3}
                onChange={e => {
                  setDeclaration3(e.target.checked);
                  if (errors.declaration)
                    setErrors(p => {
                      const n = { ...p };
                      delete n.declaration;
                      return n;
                    });
                }}
              />
              <span>
                I agree that visa approval is subject to Oman Immigration
                authority.
              </span>
            </label>
            {errors.declaration && (
              <p className='oman-visa-error'>{errors.declaration}</p>
            )}
          </div>

          {/* Submit */}
          <div className='oman-visa-form-actions'>
            <button
              type='submit'
              className='oman-visa-submit-btn'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className='oman-visa-spin' />
                  Redirecting to payment...
                </>
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>

          {/* Footer Security Line */}
          <p className='oman-visa-footer-security'>
            <Shield size={16} />
            Your information is secure and will be used only for visa processing
            purposes.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function OmanVisaApplyPage() {
  return (
    <Suspense
      fallback={
        <div className='oman-visa-page'>
          <div className='oman-visa-container'>
            <div className='oman-visa-header'>
              <div className='animate-pulse' style={{ color: '#6b7280' }}>
                Loading...
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OmanVisaApplyContent />
    </Suspense>
  );
}
