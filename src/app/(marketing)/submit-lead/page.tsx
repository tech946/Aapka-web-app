'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import './leads.css';

interface LeadFormData {
  // 1. Lead Details
  full_name_as_per_passport: string;
  whatsapp_number: string;
  email_id: string;
  nationality: string;
  city_country_of_departure: string;

  // 2. Travel Dates
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  flexible_dates: boolean;

  // 3. Traveler Details
  total_travelers: number;
  adults: number;
  children_count: number;
  children_ages: string;
  infant_count: number;
  senior_travelers: boolean;
  senior_travelers_age_detail: string;
  special_needs: string;

  // 4. Visa Requirements
  need_dubai_visa: boolean;

  // 5. Hotel Preference
  hotel_category: string;
  room_type: string;
  room_type_id?: string;
  meal_plan: string;
  preferred_location: string;
  bed_type: string;
  smoking_room_required: boolean;

  // 6. Tours & Activities
  dubai_city_tour: boolean;
  abu_dhabi_city_tour: boolean;
  desert_safari: string;
  marina_dinner_cruise: boolean;
  creek_cruise: boolean;
  burj_khalifa_ticket: string;
  dubai_frame: boolean;
  miracle_garden: boolean;
  global_village: boolean;
  ain_dubai: boolean;
  atlantis_aquaventure: boolean;
  ski_dubai: boolean;
  ferrari_world: boolean;
  warner_bros: boolean;
  motiongate_img: string;
  yacht_experience: string;

  // 7. Food Preferences
  vegetarian: boolean;
  jain_food: boolean;

  // 8. Budget & Payments
  per_person_budget: number;
  full_package_budget: number;
  flexible_budget: boolean;
  payment_mode: string;
  currency: string;

  // 9. Special Occasions
  honeymoon: boolean;
  anniversary: boolean;
  birthday: boolean;
  surprise_decorations: boolean;
  cake_private_dinner: boolean;
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const HOTEL_CATEGORY_OPTIONS = [
  { value: '3★', label: '3★' },
  { value: '4★', label: '4★' },
  { value: '5★', label: '5★' },
];

const MEAL_PLAN_OPTIONS = [
  { value: 'RO', label: 'RO (Room Only)' },
  { value: 'BB', label: 'BB (Bed & Breakfast)' },
  { value: 'HB', label: 'HB (Half Board)' },
  { value: 'FB', label: 'FB (Full Board)' },
];

const BED_TYPE_OPTIONS = [
  { value: 'King', label: 'King' },
  { value: 'Twin', label: 'Twin' },
];

const DESERT_SAFARI_OPTIONS = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Premium', label: 'Premium' },
  { value: 'VIP', label: 'VIP' },
];

const BURJ_KHALIFA_OPTIONS = [
  { value: 'Level 124', label: 'Level 124' },
  { value: 'Level 125', label: 'Level 125' },
  { value: 'Level 148', label: 'Level 148' },
];

const MOTIONGATE_IMG_OPTIONS = [
  { value: 'MotionGate', label: 'MotionGate' },
  { value: 'IMG', label: 'IMG' },
];

const YACHT_EXPERIENCE_OPTIONS = [
  { value: '2hr', label: '2hr' },
  { value: '3hr', label: '3hr' },
  { value: '4hr', label: '4hr' },
];

const PAYMENT_MODE_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
];

const CURRENCY_OPTIONS = [
  { value: 'AED', label: 'AED' },
  { value: 'INR', label: 'INR' },
  { value: 'USD', label: 'USD' },
];

export default function SubmitLeadPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<LeadFormData>({
    full_name_as_per_passport: '',
    whatsapp_number: '',
    email_id: '',
    nationality: '',
    city_country_of_departure: '',
    check_in_date: '',
    check_out_date: '',
    total_nights: 0,
    flexible_dates: false,
    total_travelers: 0,
    adults: 0,
    children_count: 0,
    children_ages: '',
    infant_count: 0,
    senior_travelers: false,
    senior_travelers_age_detail: '',
    special_needs: '',
    need_dubai_visa: false,
    hotel_category: '',
    room_type: '',
    room_type_id: '',
    meal_plan: '',
    preferred_location: '',
    bed_type: '',
    smoking_room_required: false,
    dubai_city_tour: false,
    abu_dhabi_city_tour: false,
    desert_safari: '',
    marina_dinner_cruise: false,
    creek_cruise: false,
    burj_khalifa_ticket: '',
    dubai_frame: false,
    miracle_garden: false,
    global_village: false,
    ain_dubai: false,
    atlantis_aquaventure: false,
    ski_dubai: false,
    ferrari_world: false,
    warner_bros: false,
    motiongate_img: '',
    yacht_experience: '',
    vegetarian: false,
    jain_food: false,
    per_person_budget: 0,
    full_package_budget: 0,
    flexible_budget: false,
    payment_mode: '',
    currency: '',
    honeymoon: false,
    anniversary: false,
    birthday: false,
    surprise_decorations: false,
    cake_private_dinner: false,
  });

  // Calculate total nights when dates change
  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date) {
      const fromDate = new Date(formData.check_in_date);
      const toDate = new Date(formData.check_out_date);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, total_nights: diffDays }));
    }
  }, [formData.check_in_date, formData.check_out_date]);

  // Calculate total travelers
  useEffect(() => {
    const total =
      formData.adults + formData.children_count + formData.infant_count;
    setFormData(prev => ({ ...prev, total_travelers: total }));
  }, [formData.adults, formData.children_count, formData.infant_count]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name_as_per_passport.trim()) {
      newErrors.full_name_as_per_passport =
        'Full name (as per passport) is required';
    }

    if (!formData.whatsapp_number.trim()) {
      newErrors.whatsapp_number = 'WhatsApp number is required';
    }

    if (
      formData.email_id &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_id)
    ) {
      newErrors.email_id = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Call our proxy API endpoint which will handle the API key
      const response = await fetch('/api/website/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      setSubmitted(true);
      toast.success('Lead submitted successfully! We will contact you soon.');

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          full_name_as_per_passport: '',
          whatsapp_number: '',
          email_id: '',
          nationality: '',
          city_country_of_departure: '',
          check_in_date: '',
          check_out_date: '',
          total_nights: 0,
          flexible_dates: false,
          total_travelers: 0,
          adults: 0,
          children_count: 0,
          children_ages: '',
          infant_count: 0,
          senior_travelers: false,
          senior_travelers_age_detail: '',
          special_needs: '',
          need_dubai_visa: false,
          hotel_category: '',
          room_type: '',
          room_type_id: '',
          meal_plan: '',
          preferred_location: '',
          bed_type: '',
          smoking_room_required: false,
          dubai_city_tour: false,
          abu_dhabi_city_tour: false,
          desert_safari: '',
          marina_dinner_cruise: false,
          creek_cruise: false,
          burj_khalifa_ticket: '',
          dubai_frame: false,
          miracle_garden: false,
          global_village: false,
          ain_dubai: false,
          atlantis_aquaventure: false,
          ski_dubai: false,
          ferrari_world: false,
          warner_bros: false,
          motiongate_img: '',
          yacht_experience: '',
          vegetarian: false,
          jain_food: false,
          per_person_budget: 0,
          full_package_budget: 0,
          flexible_budget: false,
          payment_mode: '',
          currency: '',
          honeymoon: false,
          anniversary: false,
          birthday: false,
          surprise_decorations: false,
          cake_private_dinner: false,
        });
        setSubmitted(false);
      }, 5000);
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast.error(error.message || 'Failed to submit lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LeadFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderYesNoField = (
    label: string,
    field: keyof LeadFormData,
    required = false
  ) => {
    const value = formData[field] ? 'yes' : 'no';
    return (
      <div className='lead-form-group'>
        <Label>
          {label} {required && <span className='required'>*</span>}
        </Label>
        <Select
          options={YES_NO_OPTIONS}
          value={value}
          onChange={val => handleInputChange(field, val === 'yes')}
        />
      </div>
    );
  };

  if (submitted) {
    return (
      <div className='lead-page'>
        <div className='lead-container'>
          <div className='lead-success-message'>
            <CheckCircle2 size={64} className='success-icon' />
            <h1>Thank You!</h1>
            <p>
              Your lead has been submitted successfully. We will contact you
              soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='lead-page'>
      <div className='lead-container'>
        <div className='lead-header'>
          <h1 className='lead-title'>Submit Your Travel Inquiry</h1>
          <p className='lead-subtitle'>
            Fill in the details below and our team will get back to you with the
            best travel package for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='lead-form'>
          {/* 1. Lead Details */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>1. Lead Details</h3>
            <div className='lead-form-grid'>
              <div className='lead-form-group'>
                <Label>
                  Full Name (as per passport){' '}
                  <span className='required'>*</span>
                </Label>
                <input
                  type='text'
                  value={formData.full_name_as_per_passport}
                  onChange={e =>
                    handleInputChange(
                      'full_name_as_per_passport',
                      e.target.value
                    )
                  }
                  placeholder='Enter full name as per passport'
                  className={`lead-input ${errors.full_name_as_per_passport ? 'error' : ''}`}
                />
                {errors.full_name_as_per_passport && (
                  <p className='lead-error'>
                    {errors.full_name_as_per_passport}
                  </p>
                )}
              </div>

              <div className='lead-form-group'>
                <Label>
                  WhatsApp Number <span className='required'>*</span>
                </Label>
                <input
                  type='tel'
                  value={formData.whatsapp_number}
                  onChange={e =>
                    handleInputChange('whatsapp_number', e.target.value)
                  }
                  placeholder='Enter WhatsApp number'
                  className={`lead-input ${errors.whatsapp_number ? 'error' : ''}`}
                />
                {errors.whatsapp_number && (
                  <p className='lead-error'>{errors.whatsapp_number}</p>
                )}
              </div>

              <div className='lead-form-group'>
                <Label>Email ID (Optional)</Label>
                <input
                  type='email'
                  value={formData.email_id}
                  onChange={e => handleInputChange('email_id', e.target.value)}
                  placeholder='Enter email ID'
                  className={`lead-input ${errors.email_id ? 'error' : ''}`}
                />
                {errors.email_id && (
                  <p className='lead-error'>{errors.email_id}</p>
                )}
              </div>

              <div className='lead-form-group'>
                <Label>Nationality</Label>
                <input
                  type='text'
                  value={formData.nationality}
                  onChange={e =>
                    handleInputChange('nationality', e.target.value)
                  }
                  placeholder='Enter nationality'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group full-width'>
                <Label>City / Country of Departure</Label>
                <input
                  type='text'
                  value={formData.city_country_of_departure}
                  onChange={e =>
                    handleInputChange(
                      'city_country_of_departure',
                      e.target.value
                    )
                  }
                  placeholder='Enter city/country of departure'
                  className='lead-input'
                />
              </div>
            </div>
          </div>

          {/* 2. Travel Dates */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>2. Travel Dates</h3>
            <div className='lead-form-grid'>
              <div className='lead-form-group'>
                <Label>Check-in Date</Label>
                <input
                  type='date'
                  value={formData.check_in_date}
                  onChange={e =>
                    handleInputChange('check_in_date', e.target.value)
                  }
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Check-out Date</Label>
                <input
                  type='date'
                  value={formData.check_out_date}
                  onChange={e =>
                    handleInputChange('check_out_date', e.target.value)
                  }
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Total Nights</Label>
                <input
                  type='number'
                  value={formData.total_nights}
                  readOnly
                  className='lead-input'
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              {renderYesNoField('Flexible Dates?', 'flexible_dates')}
            </div>
          </div>

          {/* 3. Traveler Details */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>3. Traveler Details</h3>
            <div className='lead-form-grid'>
              <div className='lead-form-group'>
                <Label>Total Travelers</Label>
                <input
                  type='number'
                  value={formData.total_travelers}
                  readOnly
                  className='lead-input'
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className='lead-form-group'>
                <Label>Adults (8+ yrs)</Label>
                <input
                  type='number'
                  min='0'
                  value={formData.adults}
                  onChange={e =>
                    handleInputChange('adults', parseInt(e.target.value) || 0)
                  }
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Children & Ages (2-8 yrs)</Label>
                <input
                  type='number'
                  min='0'
                  value={formData.children_count}
                  onChange={e =>
                    handleInputChange(
                      'children_count',
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder='Number of children'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Children Ages</Label>
                <input
                  type='text'
                  value={formData.children_ages}
                  onChange={e =>
                    handleInputChange('children_ages', e.target.value)
                  }
                  placeholder='e.g., 5, 7'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Infant Count (0-2 yrs)</Label>
                <input
                  type='number'
                  min='0'
                  value={formData.infant_count}
                  onChange={e =>
                    handleInputChange(
                      'infant_count',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className='lead-input'
                />
              </div>

              {renderYesNoField('Senior Travelers', 'senior_travelers')}

              {formData.senior_travelers && (
                <div className='lead-form-group full-width'>
                  <Label>Senior Travelers Age Detail</Label>
                  <input
                    type='text'
                    value={formData.senior_travelers_age_detail}
                    onChange={e =>
                      handleInputChange(
                        'senior_travelers_age_detail',
                        e.target.value
                      )
                    }
                    placeholder='Enter age details'
                    className='lead-input'
                  />
                </div>
              )}

              <div className='lead-form-group full-width'>
                <Label>Special Needs</Label>
                <textarea
                  value={formData.special_needs}
                  onChange={e =>
                    handleInputChange('special_needs', e.target.value)
                  }
                  placeholder='Enter any special needs or requirements'
                  className='lead-input'
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 4. Visa Requirements */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>4. Visa Requirements</h3>
            <div className='lead-form-grid'>
              {renderYesNoField('Need Dubai Visa?', 'need_dubai_visa')}
            </div>
          </div>

          {/* 5. Hotel Preference */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>5. Hotel Preference</h3>
            <div className='lead-form-grid'>
              <div className='lead-form-group'>
                <Label>Hotel Category</Label>
                <Select
                  options={HOTEL_CATEGORY_OPTIONS}
                  value={formData.hotel_category}
                  onChange={val => handleInputChange('hotel_category', val)}
                  placeholder='Select hotel category'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Room Type</Label>
                <input
                  type='text'
                  value={formData.room_type}
                  onChange={e => handleInputChange('room_type', e.target.value)}
                  placeholder='Enter room type'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Meal Plan</Label>
                <Select
                  options={MEAL_PLAN_OPTIONS}
                  value={formData.meal_plan}
                  onChange={val => handleInputChange('meal_plan', val)}
                  placeholder='Select meal plan'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Preferred Location</Label>
                <input
                  type='text'
                  value={formData.preferred_location}
                  onChange={e =>
                    handleInputChange('preferred_location', e.target.value)
                  }
                  placeholder='e.g., Deira, Bur Dubai, Downtown, Marina, JBR, Palm'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Bed Type</Label>
                <Select
                  options={BED_TYPE_OPTIONS}
                  value={formData.bed_type}
                  onChange={val => handleInputChange('bed_type', val)}
                  placeholder='Select bed type'
                />
              </div>

              {renderYesNoField(
                'Smoking Room Required',
                'smoking_room_required'
              )}
            </div>
          </div>

          {/* 6. Tours & Activities */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>6. Tours & Activities</h3>
            <div className='lead-form-grid'>
              {renderYesNoField('Dubai City Tour', 'dubai_city_tour')}
              {renderYesNoField('Abu Dhabi City Tour', 'abu_dhabi_city_tour')}

              <div className='lead-form-group'>
                <Label>Desert Safari</Label>
                <Select
                  options={DESERT_SAFARI_OPTIONS}
                  value={formData.desert_safari}
                  onChange={val => handleInputChange('desert_safari', val)}
                  placeholder='Select desert safari type'
                />
              </div>

              {renderYesNoField('Marina Dinner Cruise', 'marina_dinner_cruise')}
              {renderYesNoField('Creek Cruise', 'creek_cruise')}

              <div className='lead-form-group'>
                <Label>Burj Khalifa Ticket</Label>
                <Select
                  options={BURJ_KHALIFA_OPTIONS}
                  value={formData.burj_khalifa_ticket}
                  onChange={val =>
                    handleInputChange('burj_khalifa_ticket', val)
                  }
                  placeholder='Select level'
                />
              </div>

              {renderYesNoField('Dubai Frame', 'dubai_frame')}
              {renderYesNoField('Miracle Garden', 'miracle_garden')}
              {renderYesNoField('Global Village', 'global_village')}
              {renderYesNoField('Ain Dubai', 'ain_dubai')}
              {renderYesNoField('Atlantis Aquaventure', 'atlantis_aquaventure')}
              {renderYesNoField('Ski Dubai', 'ski_dubai')}
              {renderYesNoField('Ferrari World', 'ferrari_world')}
              {renderYesNoField('Warner Bros', 'warner_bros')}

              <div className='lead-form-group'>
                <Label>MotionGate / IMG</Label>
                <Select
                  options={MOTIONGATE_IMG_OPTIONS}
                  value={formData.motiongate_img}
                  onChange={val => handleInputChange('motiongate_img', val)}
                  placeholder='Select option'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Yacht Experience</Label>
                <Select
                  options={YACHT_EXPERIENCE_OPTIONS}
                  value={formData.yacht_experience}
                  onChange={val => handleInputChange('yacht_experience', val)}
                  placeholder='Select duration'
                />
              </div>
            </div>
          </div>

          {/* 7. Food Preferences */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>7. Food Preferences</h3>
            <div className='lead-form-grid'>
              {renderYesNoField('Vegetarian', 'vegetarian')}
              {renderYesNoField('Jain Food', 'jain_food')}
            </div>
          </div>

          {/* 8. Budget & Payments */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>8. Budget & Payments</h3>
            <div className='lead-form-grid'>
              <div className='lead-form-group'>
                <Label>Per Person Budget</Label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.per_person_budget || ''}
                  onChange={e =>
                    handleInputChange(
                      'per_person_budget',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='Enter per person budget'
                  className='lead-input'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Full Package Budget</Label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.full_package_budget || ''}
                  onChange={e =>
                    handleInputChange(
                      'full_package_budget',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='Enter full package budget'
                  className='lead-input'
                />
              </div>

              {renderYesNoField('Flexible Budget?', 'flexible_budget')}

              <div className='lead-form-group'>
                <Label>Payment Mode</Label>
                <Select
                  options={PAYMENT_MODE_OPTIONS}
                  value={formData.payment_mode}
                  onChange={val => handleInputChange('payment_mode', val)}
                  placeholder='Select payment mode'
                />
              </div>

              <div className='lead-form-group'>
                <Label>Currency</Label>
                <Select
                  options={CURRENCY_OPTIONS}
                  value={formData.currency}
                  onChange={val => handleInputChange('currency', val)}
                  placeholder='Select currency'
                />
              </div>
            </div>
          </div>

          {/* 9. Special Occasions */}
          <div className='lead-section'>
            <h3 className='lead-section-title'>9. Special Occasions</h3>
            <div className='lead-form-grid'>
              {renderYesNoField('Honeymoon', 'honeymoon')}
              {renderYesNoField('Anniversary', 'anniversary')}
              {renderYesNoField('Birthday', 'birthday')}
              {renderYesNoField('Surprise Decorations', 'surprise_decorations')}
              {renderYesNoField('Cake / Private Dinner', 'cake_private_dinner')}
            </div>
          </div>

          <div className='lead-form-actions'>
            <button
              type='submit'
              className='lead-submit-btn'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className='spinning' />
                  Submitting...
                </>
              ) : (
                'Submit Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
