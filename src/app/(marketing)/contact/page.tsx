'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import './contact.css';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit query');
      }

      toast.success('Thank you! We will contact you soon.');
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='contact-page'>
      <div className='contact-container'>
        {/* Left Panel - Contact Information */}
        <div className='contact-info-panel'>
          <div className='contact-badge'>CONTACT US</div>
          <h1 className='contact-heading'>
            We'd love to hear from <span className='highlight'>you</span>
          </h1>
          <p className='contact-description'>
            Whether you're looking for guidance on planning your perfect Dubai
            adventure or simply want to connect, we're here to help. Fill out
            the form and our team will get back to you as soon as possible.
            Contact our Sales team for information on our tour packages and
            services.
          </p>

          {/* Google Map */}
          <div className='contact-map-container'>
            <iframe
              src='https://www.google.com/maps?q=Office+%2310118%2C+CBD+Bank+Building%2C+Near+Sharaf+DG+Metro+Exit+1%2C+Al+Mankhool%2C+Bur+Dubai%2C+UAE&output=embed&zoom=15'
              width='100%'
              height='100%'
              style={{ border: 0 }}
              allowFullScreen
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
              title='Aapka Tourism Office Location - Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool, Bur Dubai, UAE'
            ></iframe>
          </div>

          {/* Contact Options */}
          <div className='contact-options'>
            <a href='mailto:info@aapkatourism.com' className='contact-option'>
              <Mail size={20} />
              <span>Contact sales</span>
            </a>
            <a href='tel:+971567809460' className='contact-option'>
              <Phone size={20} />
              <span>+971567809460</span>
            </a>
            <a
              href='https://maps.google.com/?q=Office+%2310118%2C+CBD+Bank+Building%2C+Near+Sharaf+DG+Metro+Exit+1%2C+Al+Mankhool%2C+Bur+Dubai%2C+UAE'
              target='_blank'
              rel='noopener noreferrer'
              className='contact-option'
            >
              <MapPin size={20} />
              <span>
                Office #10118, CBD Bank Building, Al Mankhool, Bur Dubai
              </span>
            </a>
          </div>
        </div>

        {/* Right Panel - Contact Form */}
        <div className='contact-form-panel'>
          <h2 className='form-heading'>Submit Your Query Today!</h2>
          <p className='form-description'>
            Fill out the form below and our team will get back to you as soon as
            possible.
          </p>

          <form onSubmit={handleSubmit} className='contact-form'>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='firstName'>
                  First Name <span className='required'>*</span>
                </label>
                <input
                  type='text'
                  id='firstName'
                  name='firstName'
                  placeholder='First Name'
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='lastName'>
                  Last Name <span className='required'>*</span>
                </label>
                <input
                  type='text'
                  id='lastName'
                  name='lastName'
                  placeholder='Last Name'
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='email'>
                  Email <span className='required'>*</span>
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  placeholder='e.g. email@hello.com'
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='phone'>
                  Phone Number <span className='required'>*</span>
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  placeholder='000-000-0000'
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className='form-group full-width'>
              <label htmlFor='message'>Any additional information:</label>
              <textarea
                id='message'
                name='message'
                placeholder='Tell us more about your travel requirements...'
                rows={5}
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <button
              type='submit'
              className='submit-button'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className='spinning' />
                  Submitting...
                </>
              ) : (
                'Submit Query >>'
              )}
            </button>
          </form>

          <div className='form-footer'>
            <p className='form-footer-text'>
              <strong>Speak with a travel expert</strong>
            </p>
            <p className='form-footer-text'>
              Don't like forms? Email us:{' '}
              <a href='mailto:info@aapkatourism.com'>info@aapkatourism.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
