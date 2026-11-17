'use client';

import { useState } from 'react';
import { BadgeCheck, Clock, IdCard, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Select from '@/components/site/ui/Select';
import DateField from '@/components/site/ui/DateField';
import { FactList, HelpCard, PageShell, SideCard } from '@/components/site/page/PageShell';

const NATIONALITY_OPTIONS = [
  { value: 'india', label: 'India' },
  { value: 'canada', label: 'Canada' },
  { value: 'us', label: 'US' },
  { value: 'europe', label: 'Europe' },
  { value: 'australian', label: 'Australian' },
  { value: 'british', label: 'British' },
];

const STATUS_IN_UAE_OPTIONS = [
  { value: 'residence_in_uae', label: 'Residence in UAE' },
  { value: 'tourist_in_uae', label: 'Tourist in UAE' },
];

const OMAN_VISA_STATUS_OPTIONS = [
  { value: 'i_have_oman_visa', label: 'I have Oman visa' },
  { value: 'i_dont_need_visa', label: "I don't need visa to visit Oman" },
  {
    value: 'visa_on_arrival',
    label: 'I can get visa on arrival at Oman border',
  },
];

const FLIGHT_HOTEL_OPTIONS = [
  { value: '', label: 'Select' },
  {
    value: 'flight_ticket',
    label: 'I have flight ticket from Muscat to home country',
  },
  { value: 'hotel_booking', label: 'I have hotel booking in Muscat' },
  { value: 'both', label: 'I have both flight ticket and hotel booking' },
  { value: 'none', label: 'None' },
];

const TRAVEL_FACTS = [
  { icon: IdCard, title: 'Passport valid 6+ months', text: 'Carry your original passport and UAE visa or Emirates ID.' },
  { icon: BadgeCheck, title: 'Oman visa if needed', text: 'Check your visa eligibility before you book.' },
  { icon: Clock, title: 'Border waiting time', text: 'Set by immigration, not by us.' },
  { icon: ShieldAlert, title: 'Transport only', text: 'Entry into Oman is up to Oman Immigration.' },
];

const TERMS_CONTENT =`AAPKA Tourism – Oman Exit Transportation Terms & Conditions

1. Transportation Service Only
AAPKA Tourism provides transportation service only from UAE to Oman border. We do not guarantee entry into Oman.

2. Immigration Approval
Entry into Oman is completely subject to Oman Immigration approval. If immigration refuses entry for any reason (visa, nationality restrictions, documentation, etc.), AAPKA Tourism will not be responsible.

3. Visa Responsibility
Passengers are fully responsible for checking their visa eligibility, visa status, and immigration requirements before booking.

4. Valid Documents Required
All passengers must carry the following documents:
• Original passport (minimum 6 months validity)
• UAE visa / Emirates ID (if resident)
• Oman visa (if required)
• Return or onward travel proof (if required)
• Hotel booking (if required)

5. Denied Entry at Border
If a passenger is refused entry by Oman Immigration, the passenger must arrange their own return transportation from the border at their own cost.

6. No Refund Policy
Transportation charges are non-refundable once the vehicle departs from the pickup location, even if the passenger is denied entry at the border.

7. Waiting Time at Border
Border processing time is controlled by immigration authorities. AAPKA Tourism has no control over processing time.

8. Passenger Responsibility
Passengers must ensure that they:
• Do not have overstay fines or travel restrictions
• Are eligible to exit UAE and enter Oman`;

export default function OmanTransportPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passportValidityAccepted, setPassportValidityAccepted] =
    useState(false);

  const [formData, setFormData] = useState({
    travelling_date: '',
    lead_passenger_name: '',
    whatsapp_number: '',
    calling_number: '',
    email: '',
    nationality: '',
    status_in_uae: '',
    oman_visa_status: '',
    number_of_adults: '1',
    number_of_children: '0',
    flight_hotel_booking: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: String(value) }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.travelling_date.trim())
      newErrors.travelling_date = 'Required';
    if (!formData.lead_passenger_name.trim())
      newErrors.lead_passenger_name = 'Required';
    if (!formData.whatsapp_number.trim())
      newErrors.whatsapp_number = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email';
    if (!formData.nationality.trim()) newErrors.nationality = 'Required';
    if (!formData.status_in_uae.trim()) newErrors.status_in_uae = 'Required';
    if (!formData.oman_visa_status.trim())
      newErrors.oman_visa_status = 'Required';

    const adults = parseInt(formData.number_of_adults, 10);
    if (isNaN(adults) || adults < 0)
      newErrors.number_of_adults = 'Enter valid number';
    const children = parseInt(formData.number_of_children, 10);
    if (isNaN(children) || children < 0)
      newErrors.number_of_children = 'Enter valid number';

    if (!passportValidityAccepted)
      newErrors.passport_validity =
        'You must confirm all passengers have passport validity of more than 6 months';
    if (!termsAccepted)
      newErrors.terms = 'You must read and accept the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTermsCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setTermsModalOpen(true);
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTermsModalOpen(false);
    if (errors.terms) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.terms;
        return next;
      });
    }
  };

  const handlePassportCheckboxChange = () => {
    setPassportValidityAccepted(p => !p);
    if (errors.passport_validity) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.passport_validity;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill all required fields and accept the terms');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/oman-transport-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelling_date: formData.travelling_date,
          lead_passenger_name: formData.lead_passenger_name,
          whatsapp_number: formData.whatsapp_number,
          calling_number: formData.calling_number || null,
          email: formData.email,
          nationality: formData.nationality,
          status_in_uae: formData.status_in_uae,
          oman_visa_status: formData.oman_visa_status,
          number_of_adults: parseInt(formData.number_of_adults, 10) || 1,
          number_of_children: parseInt(formData.number_of_children, 10) || 0,
          flight_hotel_booking: formData.flight_hotel_booking || null,
          passport_validity_accepted: passportValidityAccepted,
          terms_accepted: termsAccepted,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success(data.message || 'Enquiry submitted successfully!');
      setFormData({
        travelling_date: '',
        lead_passenger_name: '',
        whatsapp_number: '',
        calling_number: '',
        email: '',
        nationality: '',
        status_in_uae: '',
        oman_visa_status: '',
        number_of_adults: '1',
        number_of_children: '0',
        flight_hotel_booking: '',
      });
      setTermsAccepted(false);
      setPassportValidityAccepted(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      kicker='Visas & transport'
      title='Oman Exit Transportation'
      text='Book your transport from the UAE to the Oman border. Fill in the form and we will get back to you shortly.'
      image='/images/stock/dest-musandam.jpg'
      aside={
        <>
          <SideCard title='Before you travel'>
            <FactList items={TRAVEL_FACTS} />
          </SideCard>
          <HelpCard text='Not sure about your visa or documents? Ask us before you book.' />
        </>
      }
    >
        <form className='xp-form' onSubmit={handleSubmit}>
          <div className='xp-section'>
            <h3 className='xp-section-title'>Passenger Details</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>
                  Travelling Date <span className='xp-req'>*</span>
                </label>
                <DateField
                  value={formData.travelling_date}
                  onChange={iso => handleInputChange('travelling_date', iso)}
                  placeholder='Select travelling date'
                  invalid={!!errors.travelling_date}
                />
                {errors.travelling_date && (
                  <p className='xp-error'>
                    {errors.travelling_date}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>
                  Lead Passenger Name{' '}
                  <span className='xp-req'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.lead_passenger_name}
                  onChange={e =>
                    handleInputChange('lead_passenger_name', e.target.value)
                  }
                  placeholder='Full name as per passport'
                  className={errors.lead_passenger_name ? 'error' : ''}
                />
                {errors.lead_passenger_name && (
                  <p className='xp-error'>
                    {errors.lead_passenger_name}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>
                  WhatsApp Number <span className='xp-req'>*</span>
                </label>
                <input
                  type='tel'
                  value={formData.whatsapp_number}
                  onChange={e =>
                    handleInputChange('whatsapp_number', e.target.value)
                  }
                  placeholder='+971...'
                  className={errors.whatsapp_number ? 'error' : ''}
                />
                {errors.whatsapp_number && (
                  <p className='xp-error'>
                    {errors.whatsapp_number}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>Calling Number</label>
                <input
                  type='tel'
                  value={formData.calling_number}
                  onChange={e =>
                    handleInputChange('calling_number', e.target.value)
                  }
                  placeholder='+971...'
                />
              </div>
              <div className='xp-form-group'>
                <label>
                  Email Address <span className='xp-req'>*</span>
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='your@email.com'
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <p className='xp-error'>{errors.email}</p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>
                  Nationality
                  <span className='xp-req'>*</span>
                </label>
                <Select
                  value={formData.nationality}
                  onChange={v => handleInputChange('nationality', v)}
                  options={NATIONALITY_OPTIONS}
                  placeholder='Select nationality'
                  invalid={!!errors.nationality}
                  aria-label='Nationality'
                />
                {errors.nationality && (
                  <p className='xp-error'>{errors.nationality}</p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Visa & Status</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>
                  Status in UAE <span className='xp-req'>*</span>
                </label>
                <Select
                  value={formData.status_in_uae}
                  onChange={v => handleInputChange('status_in_uae', v)}
                  options={STATUS_IN_UAE_OPTIONS}
                  placeholder='Select'
                  invalid={!!errors.status_in_uae}
                  aria-label='Status in UAE'
                />
                {errors.status_in_uae && (
                  <p className='xp-error'>{errors.status_in_uae}</p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>
                  Oman Visa Status <span className='xp-req'>*</span>
                </label>
                <Select
                  value={formData.oman_visa_status}
                  onChange={v => handleInputChange('oman_visa_status', v)}
                  options={OMAN_VISA_STATUS_OPTIONS}
                  placeholder='Select'
                  invalid={!!errors.oman_visa_status}
                  aria-label='Oman visa status'
                />
                {errors.oman_visa_status && (
                  <p className='xp-error'>
                    {errors.oman_visa_status}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>Flight / Hotel Booking in Oman</label>
                <Select
                  value={formData.flight_hotel_booking}
                  onChange={v => handleInputChange('flight_hotel_booking', v)}
                  options={FLIGHT_HOTEL_OPTIONS.filter(o => o.value)}
                  placeholder='Select'
                  aria-label='Flight / hotel booking in Oman'
                />
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>Passenger Count</h3>
            <div className='xp-form-grid'>
              <div className='xp-form-group'>
                <label>
                  Number of Adults <span className='xp-req'>*</span>
                </label>
                <input
                  type='number'
                  min={0}
                  value={formData.number_of_adults}
                  onChange={e =>
                    handleInputChange('number_of_adults', e.target.value)
                  }
                  className={errors.number_of_adults ? 'error' : ''}
                />
                {errors.number_of_adults && (
                  <p className='xp-error'>
                    {errors.number_of_adults}
                  </p>
                )}
              </div>
              <div className='xp-form-group'>
                <label>
                  Number of Children <span className='xp-req'>*</span>
                </label>
                <input
                  type='number'
                  min={0}
                  value={formData.number_of_children}
                  onChange={e =>
                    handleInputChange('number_of_children', e.target.value)
                  }
                  className={errors.number_of_children ? 'error' : ''}
                />
                {errors.number_of_children && (
                  <p className='xp-error'>
                    {errors.number_of_children}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='xp-section'>
            <h3 className='xp-section-title'>
              Declaration & Terms
            </h3>
            <p className='xp-declaration-note'>
              For UAE residents, the Emirates ID must have a minimum validity of
              3 months in order to obtain a visa on arrival.
            </p>
            <label className='xp-terms-checkbox'>
              <input
                type='checkbox'
                checked={passportValidityAccepted}
                onChange={handlePassportCheckboxChange}
              />
              <span>
                All passengers have passport validity of more than 6 months{' '}
                <span className='xp-req'>*</span>
              </span>
            </label>
            {errors.passport_validity && (
              <p className='xp-error'>{errors.passport_validity}</p>
            )}
            <label
              className='xp-terms-checkbox'
              onClick={handleTermsCheckboxClick}
            >
              <input
                type='checkbox'
                checked={termsAccepted}
                onChange={() => {}}
                readOnly
              />
              <span>
                I have read and accept the{' '}
                <span
                  className='xp-terms-link'
                  role='button'
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    setTermsModalOpen(true);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTermsModalOpen(true);
                    }
                  }}
                >
                  AAPKA Tourism – Oman Exit Transportation Terms & Conditions
                </span>
              </span>
            </label>
            {errors.terms && (
              <p className='xp-error'>{errors.terms}</p>
            )}
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
                  Submitting...
                </>
              ) : (
                'Submit Enquiry'
              )}
            </button>
          </div>
        </form>

      {termsModalOpen && (
        <div className='xp-modal-overlay'>
          <div
            className='xp-modal-content'
            onClick={e => e.stopPropagation()}
          >
            <div className='xp-modal-header'>
              <h2 className='xp-modal-title'>
                Oman Exit Transportation Terms & Conditions
              </h2>
              <button
                type='button'
                className='xp-modal-close'
                onClick={() => setTermsModalOpen(false)}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className='xp-modal-body'>{TERMS_CONTENT}</div>
            <div className='xp-modal-footer'>
              <button
                type='button'
                className='xp-btn xp-btn--line'
                onClick={() => setTermsModalOpen(false)}
              >
                Close
              </button>
              <button
                type='button'
                className='xp-btn xp-btn--brand'
                onClick={handleAcceptTerms}
              >
                I have read and accept the terms
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
