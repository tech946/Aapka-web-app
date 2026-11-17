'use client';

import { useState } from 'react';
import { Bus, Compass, Hotel, Loader2, MapPinned, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import Select from '@/components/site/ui/Select';
import { FactList, HelpCard, PageShell, SideCard } from '@/components/site/page/PageShell';

const SERVICE_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'dmc', label: 'DMC' },
  { value: 'transport', label: 'Transport' },
  { value: 'tour_operator', label: 'Tour operator' },
] as const;

const PARTNER_TYPES = [
  { icon: Hotel, title: 'Hotels' },
  { icon: UtensilsCrossed, title: 'Restaurants' },
  { icon: MapPinned, title: 'DMCs' },
  { icon: Bus, title: 'Transport companies' },
  { icon: Compass, title: 'Tour operators' },
];

const YEARS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const REQ = <span className='xp-req'>*</span>;

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
    license_type: '',
    why_partner_with_aapka: '',
    dedicated_manager_available: '' as '' | 'true' | 'false',
  });

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
    if (!formData.license_type.trim()) newErrors.license_type = 'Required';
    if (!formData.why_partner_with_aapka.trim())
      newErrors.why_partner_with_aapka = 'Required';
    if (!formData.dedicated_manager_available)
      newErrors.dedicated_manager_available = 'Please select yes or no';

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
      fd.append('license_type', formData.license_type.trim());
      fd.append('why_partner_with_aapka', formData.why_partner_with_aapka.trim());
      fd.append(
        'dedicated_manager_available',
        formData.dedicated_manager_available
      );

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
        license_type: '',
        why_partner_with_aapka: '',
        dedicated_manager_available: '',
      });
      setRegFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      kicker='Do business with us'
      title='B2B collaboration'
      text='Hotels, restaurants, DMCs, transport and tour operators: partner with Aapka Tourism. Fill in the form and our team will review your profile and get back to you.'
      image='/images/stock/banner-burj-palms.jpg'
      aside={
        <>
          <SideCard title='Who we work with'>
            <FactList items={PARTNER_TYPES} />
          </SideCard>
          <HelpCard text='Questions before you apply? Talk to our team.' />
        </>
      }
    >
        <form className='xp-form' onSubmit={handleSubmit}>
          <div className='xp-section'>
            <h3 className='xp-section-title'>Company & contact</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>Company name {REQ}</label>
                <input
                  type='text'
                  value={formData.company_name}
                  onChange={e => handleChange('company_name', e.target.value)}
                  className={errors.company_name ? 'error' : ''}
                  autoComplete='organization'
                />
                {errors.company_name && (
                  <p className='xp-error'>{errors.company_name}</p>
                )}
              </div>
              <div className='xp-form-group'>
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
                  <p className='xp-error'>
                    {errors.contact_person_name}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
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
                  <p className='xp-error'>{errors.whatsapp_number}</p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>Email {REQ}</label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                  autoComplete='email'
                />
                {errors.email && (
                  <p className='xp-error'>{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Location</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>Country {REQ}</label>
                <input
                  type='text'
                  value={formData.country}
                  onChange={e => handleChange('country', e.target.value)}
                  className={errors.country ? 'error' : ''}
                  autoComplete='country-name'
                />
                {errors.country && (
                  <p className='xp-error'>{errors.country}</p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>City {REQ}</label>
                <input
                  type='text'
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className={errors.city ? 'error' : ''}
                  autoComplete='address-level2'
                />
                {errors.city && (
                  <p className='xp-error'>{errors.city}</p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Service profile</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>Type of service {REQ}</label>
                <Select
                  value={formData.type_of_service}
                  onChange={v => handleChange('type_of_service', v)}
                  options={[...SERVICE_OPTIONS]}
                  placeholder='Select'
                  invalid={!!errors.type_of_service}
                  aria-label='Type of service'
                />
                {errors.type_of_service && (
                  <p className='xp-error'>{errors.type_of_service}</p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>Years in business {REQ}</label>
                <Select
                  value={formData.years_in_business}
                  onChange={v => handleChange('years_in_business', v)}
                  options={YEARS_OPTIONS}
                  placeholder='Select (1–10)'
                  invalid={!!errors.years_in_business}
                  aria-label='Years in business'
                />
                {errors.years_in_business && (
                  <p className='xp-error'>{errors.years_in_business}</p>
                )}
              </div>
              <div className='xp-form-group'>
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
              <div className='xp-form-group full-width'>
                <label>Services offered (in detail) {REQ}</label>
                <textarea
                  value={formData.services_offered_detail}
                  onChange={e =>
                    handleChange('services_offered_detail', e.target.value)
                  }
                  className={errors.services_offered_detail ? 'error' : ''}
                />
                {errors.services_offered_detail && (
                  <p className='xp-error'>
                    {errors.services_offered_detail}
                  </p>
                )}
              </div>
              <div className='xp-form-group full-width'>
                <label>Key products {REQ}</label>
                <textarea
                  value={formData.key_products}
                  onChange={e => handleChange('key_products', e.target.value)}
                  className={errors.key_products ? 'error' : ''}
                />
                {errors.key_products && (
                  <p className='xp-error'>{errors.key_products}</p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Compliance</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group full-width'>
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
                <p className='xp-hint'>PDF or image, max 10 MB.</p>
                {errors.company_registration_proof && (
                  <p className='xp-error'>
                    {errors.company_registration_proof}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>License type {REQ}</label>
                <input
                  type='text'
                  value={formData.license_type}
                  onChange={e => handleChange('license_type', e.target.value)}
                  className={errors.license_type ? 'error' : ''}
                />
                {errors.license_type && (
                  <p className='xp-error'>{errors.license_type}</p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Partnership</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group full-width'>
                <label>Why do you want to partner with Aapka? {REQ}</label>
                <textarea
                  value={formData.why_partner_with_aapka}
                  onChange={e =>
                    handleChange('why_partner_with_aapka', e.target.value)
                  }
                  className={errors.why_partner_with_aapka ? 'error' : ''}
                />
                {errors.why_partner_with_aapka && (
                  <p className='xp-error'>
                    {errors.why_partner_with_aapka}
                  </p>
                )}
              </div>
              <div className='xp-form-group full-width'>
                <label>Dedicated manager available? {REQ}</label>
                <div className='xp-radio-group'>
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
                  <p className='xp-error'>
                    {errors.dedicated_manager_available}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-form-actions'>
            <button
              type='submit'
              className='xp-submit-btn'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className='xp-spin' />
                  Submitting…
                </>
              ) : (
                'Submit partnership request'
              )}
            </button>
          </div>
        </form>
    </PageShell>
  );
}
