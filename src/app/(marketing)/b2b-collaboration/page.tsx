'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import './b2b-collaboration.css';

const SERVICE_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'dmc', label: 'DMC' },
  { value: 'transport', label: 'Transport' },
  { value: 'tour_operator', label: 'Tour operator' },
] as const;

const YEARS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const REQ = <span style={{ color: '#dc2626' }}>*</span>;

export default function B2BCollaborationPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person_name: '',
    whatsapp_number: '',
    email: '',
    country: '',
    city: '',
    type_of_service: '',
    years_in_business: '',
    company_website_or_instagram: '',
    services_offered_detail: '',
    key_products: '',
    offers_b2b_rates: '' as '' | 'true' | 'false',
    commission_markup_structure: '',
    provides_transfers: '' as '' | 'true' | 'false',
    fleet_details: '',
    tripadvisor_google_rating_link: '',
    existing_clients: '',
    license_type: '',
    why_partner_with_aapka: '',
    dedicated_manager_available: '' as '' | 'true' | 'false',
    special_offers_for_us: '',
  });

  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [regFile, setRegFile] = useState<File | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateFile = (file: File | null, field: string): string | null => {
    if (!file) return null;
    if (file.size > MAX_FILE_BYTES) return 'File must be 10 MB or less';
    const ok =
      file.type === 'application/pdf' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp';
    if (!ok) return 'Use PDF, JPG, PNG, or WebP';
    return null;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) newErrors.company_name = 'Required';
    if (!formData.contact_person_name.trim())
      newErrors.contact_person_name = 'Required';
    if (!formData.whatsapp_number.trim())
      newErrors.whatsapp_number = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email';
    if (!formData.country.trim()) newErrors.country = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    if (!formData.type_of_service)
      newErrors.type_of_service = 'Select a type of service';
    const y = parseInt(formData.years_in_business, 10);
    if (!formData.years_in_business || y < 1 || y > 10)
      newErrors.years_in_business = 'Select years in business (1–10)';
    if (!formData.services_offered_detail.trim())
      newErrors.services_offered_detail = 'Required';
    if (!formData.key_products.trim()) newErrors.key_products = 'Required';
    if (!formData.offers_b2b_rates)
      newErrors.offers_b2b_rates = 'Please select yes or no';
    if (!formData.commission_markup_structure.trim())
      newErrors.commission_markup_structure = 'Required';
    if (!formData.provides_transfers)
      newErrors.provides_transfers = 'Please select yes or no';
    if (!formData.fleet_details.trim())
      newErrors.fleet_details = 'Required (enter N/A if not applicable)';
    if (!formData.license_type.trim()) newErrors.license_type = 'Required';
    if (!formData.why_partner_with_aapka.trim())
      newErrors.why_partner_with_aapka = 'Required';
    if (!formData.dedicated_manager_available)
      newErrors.dedicated_manager_available = 'Please select yes or no';
    if (!formData.special_offers_for_us.trim())
      newErrors.special_offers_for_us = 'Required';

    const sErr = validateFile(sampleFile, 'sample');
    if (sErr) newErrors.sample_package_rate_card = sErr;
    const rErr = validateFile(regFile, 'reg');
    if (rErr) newErrors.company_registration_proof = rErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('company_name', formData.company_name.trim());
      fd.append('contact_person_name', formData.contact_person_name.trim());
      fd.append('whatsapp_number', formData.whatsapp_number.trim());
      fd.append('email', formData.email.trim());
      fd.append('country', formData.country.trim());
      fd.append('city', formData.city.trim());
      fd.append('type_of_service', formData.type_of_service);
      fd.append('years_in_business', formData.years_in_business);
      fd.append(
        'company_website_or_instagram',
        formData.company_website_or_instagram.trim()
      );
      fd.append('services_offered_detail', formData.services_offered_detail.trim());
      fd.append('key_products', formData.key_products.trim());
      fd.append('offers_b2b_rates', formData.offers_b2b_rates);
      fd.append(
        'commission_markup_structure',
        formData.commission_markup_structure.trim()
      );
      fd.append('provides_transfers', formData.provides_transfers);
      fd.append('fleet_details', formData.fleet_details.trim());
      fd.append(
        'tripadvisor_google_rating_link',
        formData.tripadvisor_google_rating_link.trim()
      );
      fd.append('existing_clients', formData.existing_clients.trim());
      fd.append('license_type', formData.license_type.trim());
      fd.append('why_partner_with_aapka', formData.why_partner_with_aapka.trim());
      fd.append(
        'dedicated_manager_available',
        formData.dedicated_manager_available
      );
      fd.append('special_offers_for_us', formData.special_offers_for_us.trim());

      if (sampleFile) fd.append('sample_package_rate_card', sampleFile);
      if (regFile) fd.append('company_registration_proof', regFile);

      const res = await fetch('/api/b2b-collaboration', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success(
        data.message ||
          'Thank you. Our team will contact you shortly.'
      );
      setFormData({
        company_name: '',
        contact_person_name: '',
        whatsapp_number: '',
        email: '',
        country: '',
        city: '',
        type_of_service: '',
        years_in_business: '',
        company_website_or_instagram: '',
        services_offered_detail: '',
        key_products: '',
        offers_b2b_rates: '',
        commission_markup_structure: '',
        provides_transfers: '',
        fleet_details: '',
        tripadvisor_google_rating_link: '',
        existing_clients: '',
        license_type: '',
        why_partner_with_aapka: '',
        dedicated_manager_available: '',
        special_offers_for_us: '',
      });
      setSampleFile(null);
      setRegFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='b2b-collab-page'>
      <div className='b2b-collab-container'>
        <div className='b2b-collab-header'>
          <h1 className='b2b-collab-title'>B2B collaboration</h1>
          <p className='b2b-collab-intro'>
            Partner with Aapka Tourism. Complete the form below and we will
            review your profile and get back to you.
          </p>
        </div>

        <form className='b2b-collab-form' onSubmit={handleSubmit}>
          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Company & contact</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group'>
                <label>Company name {REQ}</label>
                <input
                  type='text'
                  value={formData.company_name}
                  onChange={e => handleChange('company_name', e.target.value)}
                  className={errors.company_name ? 'error' : ''}
                  autoComplete='organization'
                />
                {errors.company_name && (
                  <p className='b2b-collab-error'>{errors.company_name}</p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>Contact person name {REQ}</label>
                <input
                  type='text'
                  value={formData.contact_person_name}
                  onChange={e =>
                    handleChange('contact_person_name', e.target.value)
                  }
                  className={errors.contact_person_name ? 'error' : ''}
                  autoComplete='name'
                />
                {errors.contact_person_name && (
                  <p className='b2b-collab-error'>
                    {errors.contact_person_name}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>WhatsApp number {REQ}</label>
                <input
                  type='tel'
                  value={formData.whatsapp_number}
                  onChange={e =>
                    handleChange('whatsapp_number', e.target.value)
                  }
                  placeholder='+971…'
                  className={errors.whatsapp_number ? 'error' : ''}
                />
                {errors.whatsapp_number && (
                  <p className='b2b-collab-error'>{errors.whatsapp_number}</p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>Email {REQ}</label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                  autoComplete='email'
                />
                {errors.email && (
                  <p className='b2b-collab-error'>{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Location</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group'>
                <label>Country {REQ}</label>
                <input
                  type='text'
                  value={formData.country}
                  onChange={e => handleChange('country', e.target.value)}
                  className={errors.country ? 'error' : ''}
                  autoComplete='country-name'
                />
                {errors.country && (
                  <p className='b2b-collab-error'>{errors.country}</p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>City {REQ}</label>
                <input
                  type='text'
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className={errors.city ? 'error' : ''}
                  autoComplete='address-level2'
                />
                {errors.city && (
                  <p className='b2b-collab-error'>{errors.city}</p>
                )}
              </div>
            </div>
          </div>

          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Service profile</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group'>
                <label>Type of service {REQ}</label>
                <select
                  value={formData.type_of_service}
                  onChange={e =>
                    handleChange('type_of_service', e.target.value)
                  }
                  className={errors.type_of_service ? 'error' : ''}
                >
                  <option value=''>Select</option>
                  {SERVICE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.type_of_service && (
                  <p className='b2b-collab-error'>{errors.type_of_service}</p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>Years in business {REQ}</label>
                <select
                  value={formData.years_in_business}
                  onChange={e =>
                    handleChange('years_in_business', e.target.value)
                  }
                  className={errors.years_in_business ? 'error' : ''}
                >
                  <option value=''>Select (1–10)</option>
                  {YEARS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.years_in_business && (
                  <p className='b2b-collab-error'>{errors.years_in_business}</p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>Company website / Instagram</label>
                <input
                  type='text'
                  value={formData.company_website_or_instagram}
                  onChange={e =>
                    handleChange('company_website_or_instagram', e.target.value)
                  }
                  placeholder='https://… or @handle'
                />
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Services offered (in detail) {REQ}</label>
                <textarea
                  value={formData.services_offered_detail}
                  onChange={e =>
                    handleChange('services_offered_detail', e.target.value)
                  }
                  className={errors.services_offered_detail ? 'error' : ''}
                />
                {errors.services_offered_detail && (
                  <p className='b2b-collab-error'>
                    {errors.services_offered_detail}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Key products {REQ}</label>
                <textarea
                  value={formData.key_products}
                  onChange={e => handleChange('key_products', e.target.value)}
                  className={errors.key_products ? 'error' : ''}
                />
                {errors.key_products && (
                  <p className='b2b-collab-error'>{errors.key_products}</p>
                )}
              </div>
            </div>
          </div>

          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Commercial</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group full-width'>
                <label>Do you offer B2B rates? {REQ}</label>
                <div className='b2b-collab-radio-group'>
                  <label>
                    <input
                      type='radio'
                      name='offers_b2b_rates'
                      checked={formData.offers_b2b_rates === 'true'}
                      onChange={() =>
                        handleChange('offers_b2b_rates', 'true')
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type='radio'
                      name='offers_b2b_rates'
                      checked={formData.offers_b2b_rates === 'false'}
                      onChange={() =>
                        handleChange('offers_b2b_rates', 'false')
                      }
                    />
                    No
                  </label>
                </div>
                {errors.offers_b2b_rates && (
                  <p className='b2b-collab-error'>{errors.offers_b2b_rates}</p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Sample package / rate card (optional)</label>
                <input
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*'
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setSampleFile(f);
                    if (errors.sample_package_rate_card) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.sample_package_rate_card;
                        return next;
                      });
                    }
                  }}
                  className={errors.sample_package_rate_card ? 'error' : ''}
                />
                <p className='b2b-collab-hint'>
                  PDF or image, max 10 MB.
                </p>
                {errors.sample_package_rate_card && (
                  <p className='b2b-collab-error'>
                    {errors.sample_package_rate_card}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Commission / markup structure {REQ}</label>
                <textarea
                  value={formData.commission_markup_structure}
                  onChange={e =>
                    handleChange('commission_markup_structure', e.target.value)
                  }
                  className={errors.commission_markup_structure ? 'error' : ''}
                />
                {errors.commission_markup_structure && (
                  <p className='b2b-collab-error'>
                    {errors.commission_markup_structure}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Do you provide transfers? {REQ}</label>
                <div className='b2b-collab-radio-group'>
                  <label>
                    <input
                      type='radio'
                      name='provides_transfers'
                      checked={formData.provides_transfers === 'true'}
                      onChange={() =>
                        handleChange('provides_transfers', 'true')
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type='radio'
                      name='provides_transfers'
                      checked={formData.provides_transfers === 'false'}
                      onChange={() =>
                        handleChange('provides_transfers', 'false')
                      }
                    />
                    No
                  </label>
                </div>
                {errors.provides_transfers && (
                  <p className='b2b-collab-error'>{errors.provides_transfers}</p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Fleet details (if any) {REQ}</label>
                <textarea
                  value={formData.fleet_details}
                  onChange={e =>
                    handleChange('fleet_details', e.target.value)
                  }
                  placeholder='Describe your fleet, or enter N/A'
                  className={errors.fleet_details ? 'error' : ''}
                />
                {errors.fleet_details && (
                  <p className='b2b-collab-error'>{errors.fleet_details}</p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>TripAdvisor / Google rating link (optional)</label>
                <input
                  type='text'
                  value={formData.tripadvisor_google_rating_link}
                  onChange={e =>
                    handleChange('tripadvisor_google_rating_link', e.target.value)
                  }
                  placeholder='https://…'
                />
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Existing clients (optional)</label>
                <textarea
                  value={formData.existing_clients}
                  onChange={e =>
                    handleChange('existing_clients', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Compliance</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group full-width'>
                <label>Company registration proof (optional)</label>
                <input
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*'
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setRegFile(f);
                    if (errors.company_registration_proof) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.company_registration_proof;
                        return next;
                      });
                    }
                  }}
                  className={errors.company_registration_proof ? 'error' : ''}
                />
                <p className='b2b-collab-hint'>PDF or image, max 10 MB.</p>
                {errors.company_registration_proof && (
                  <p className='b2b-collab-error'>
                    {errors.company_registration_proof}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group'>
                <label>License type {REQ}</label>
                <input
                  type='text'
                  value={formData.license_type}
                  onChange={e => handleChange('license_type', e.target.value)}
                  className={errors.license_type ? 'error' : ''}
                />
                {errors.license_type && (
                  <p className='b2b-collab-error'>{errors.license_type}</p>
                )}
              </div>
            </div>
          </div>

          <div className='b2b-collab-section'>
            <h3 className='b2b-collab-section-title'>Partnership</h3>
            <div className='b2b-collab-form-grid'>
              <div className='b2b-collab-form-group full-width'>
                <label>Why do you want to partner with Aapka? {REQ}</label>
                <textarea
                  value={formData.why_partner_with_aapka}
                  onChange={e =>
                    handleChange('why_partner_with_aapka', e.target.value)
                  }
                  className={errors.why_partner_with_aapka ? 'error' : ''}
                />
                {errors.why_partner_with_aapka && (
                  <p className='b2b-collab-error'>
                    {errors.why_partner_with_aapka}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Dedicated manager available? {REQ}</label>
                <div className='b2b-collab-radio-group'>
                  <label>
                    <input
                      type='radio'
                      name='dedicated_manager_available'
                      checked={formData.dedicated_manager_available === 'true'}
                      onChange={() =>
                        handleChange('dedicated_manager_available', 'true')
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type='radio'
                      name='dedicated_manager_available'
                      checked={formData.dedicated_manager_available === 'false'}
                      onChange={() =>
                        handleChange('dedicated_manager_available', 'false')
                      }
                    />
                    No
                  </label>
                </div>
                {errors.dedicated_manager_available && (
                  <p className='b2b-collab-error'>
                    {errors.dedicated_manager_available}
                  </p>
                )}
              </div>
              <div className='b2b-collab-form-group full-width'>
                <label>Special offers for us {REQ}</label>
                <textarea
                  value={formData.special_offers_for_us}
                  onChange={e =>
                    handleChange('special_offers_for_us', e.target.value)
                  }
                  className={errors.special_offers_for_us ? 'error' : ''}
                />
                {errors.special_offers_for_us && (
                  <p className='b2b-collab-error'>
                    {errors.special_offers_for_us}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='b2b-collab-form-actions'>
            <button
              type='submit'
              className='b2b-collab-submit-btn'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className='b2b-collab-spin' />
                  Submitting…
                </>
              ) : (
                'Submit partnership request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
