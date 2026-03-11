'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  packageName: string;
  pdfUrl: string;
  packageId?: string;
}

export default function PdfDownloadModal({
  isOpen,
  onClose,
  isMobile,
  packageName,
  pdfUrl,
  packageId = '',
}: PdfDownloadModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!whatsapp.trim()) {
      toast.error('Please enter your WhatsApp number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/pdf-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          package_id: packageId,
          package_name: packageName,
          pdf_url: pdfUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      toast.success(data.message || 'Your brochure has been sent to your email!');
      onClose();
      setName('');
      setEmail('');
      setWhatsapp('');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const overlayClass = isMobile ? 'mobile-booking-modal-overlay' : 'desktop-booking-modal-overlay';
  const modalClass = isMobile ? 'mobile-booking-modal' : 'desktop-booking-modal';
  const headerClass = isMobile ? 'mobile-booking-modal-header' : 'desktop-booking-modal-header';
  const titleClass = isMobile ? 'mobile-booking-modal-title' : 'desktop-booking-modal-title';
  const closeClass = isMobile ? 'mobile-booking-modal-close' : 'desktop-booking-modal-close';
  const contentClass = isMobile ? 'mobile-booking-modal-content' : 'desktop-booking-modal-content';
  const inputWrapperClass = isMobile ? 'mobile-booking-input-wrapper' : 'booking-input-wrapper';
  const inputClass = isMobile ? 'mobile-booking-input' : 'booking-input';
  const inputIconClass = isMobile ? 'mobile-booking-input-icon' : 'booking-input-icon';
  const actionsClass = isMobile ? 'mobile-booking-actions' : 'booking-actions';
  const submitButtonClass = isMobile ? 'mobile-booking-add-to-cart-button' : 'booking-add-to-cart-button';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={e => e.stopPropagation()}>
        <div className={headerClass}>
          <h3 className={titleClass}>Send PDF Brochure</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type='button'
              className='pdf-modal-view-pdf-btn'
              onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
              title='Open PDF in new tab'
            >
              <FileDown size={18} />
              View PDF
            </button>
            <button className={closeClass} onClick={onClose} aria-label='Close'>
              <X className={isMobile ? 'close-icon' : 'desktop-booking-modal-close-icon'} />
            </button>
          </div>
        </div>
        <div className={contentClass}>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            Enter your details to receive the brochure via email
          </p>

          <form onSubmit={handleSubmit} className={isMobile ? 'mobile-input-selectors' : 'input-selectors'} style={{ flexDirection: 'column' }}>
            <div className={inputWrapperClass}>
              <User className={inputIconClass} />
              <input
                type='text'
                placeholder='Your full name'
                className={inputClass}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ cursor: 'text' }}
              />
            </div>
            <div className={inputWrapperClass}>
              <Mail className={inputIconClass} />
              <input
                type='email'
                placeholder='your@email.com'
                className={inputClass}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ cursor: 'text' }}
              />
            </div>
            <div className={inputWrapperClass}>
              <Phone className={inputIconClass} />
              <input
                type='tel'
                placeholder='+971 50 123 4567'
                className={inputClass}
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                required
                style={{ cursor: 'text' }}
              />
            </div>

            <div className={actionsClass} style={{ flexDirection: 'column', gap: 10 }}>
              <button
                type='submit'
                disabled={submitting}
                className={submitButtonClass}
              >
                {submitting ? 'Sending...' : 'Send Brochure'}
              </button>
              <button
                type='button'
                onClick={onClose}
                className='pdf-modal-cancel-button'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
