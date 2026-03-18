'use client';

import { useState, useRef } from 'react';
import { X, User, Mail, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomizePackagePreview } from './CustomizePackagePreview';
import { CRMPackageItineraryPreview } from './CRMPackageItineraryPreview';
import type { PackageOption, PersonCounts, AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import '@/app/(marketing)/category/[slug]/[packageId]/package-details.css';
import './CustomizePackagePDFModal.css';

interface CustomizePackagePDFModalProps {
  onClose: () => void;
  package: PackageOption;
  persons: PersonCounts;
  isSoloTraveller: boolean;
  selectedDeals: AddonDeal[];
  selectedServices: AddonHotelService[];
  selectedTransfers: AddonPrivateTransfer[];
  packageBasePriceOverride?: number;
  hotelSurchargeTotal?: number;
  extraBedChildNoBedTotal?: number;
  /** Effective nights (base + hotel service extension) - matches sidebar */
  effectiveNights?: number;
  /** Effective days (nights + 1) - matches sidebar */
  effectiveDays?: number;
}

export function CustomizePackagePDFModal({
  onClose,
  package: pkg,
  persons,
  isSoloTraveller,
  selectedDeals,
  selectedServices,
  selectedTransfers,
  packageBasePriceOverride,
  hotelSurchargeTotal = 0,
  extraBedChildNoBedTotal = 0,
  effectiveNights,
  effectiveDays,
}: CustomizePackagePDFModalProps) {
  const isMobile = useIsMobile();
  const [showFormModal, setShowFormModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const useCRMPreview = !!pkg.crm_package_id;

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

  const handleSendPdf = async (e: React.FormEvent) => {
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
    if (!previewRef.current) {
      toast.error('Preview not ready');
      return;
    }
    setSubmitting(true);
    try {
      const wrapper = previewRef.current;
      wrapper.classList.add('customize-pdf-export-mode');
      await new Promise((r) => setTimeout(r, 50));
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [0, 0, 0, 0],
        image: { type: 'png', quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' },
      };
      const blob = await html2pdf().set(opt).from(wrapper).outputPdf('blob');
      wrapper.classList.remove('customize-pdf-export-mode');
      const formData = new FormData();
      formData.append('file', blob, `package-${pkg.package_id || 'custom'}.pdf`);
      formData.append('folder', 'customize-pdf');
      const uploadRes = await fetch('/api/storage/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadJson.error || 'Failed to upload PDF');
        return;
      }
      const pdfUrl = uploadJson.url;
      if (!pdfUrl) {
        toast.error('Failed to get PDF URL');
        return;
      }
      const res = await fetch('/api/pdf-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          package_id: pkg.package_id || '',
          package_name: pkg.package_name || 'Package',
          pdf_url: pdfUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      toast.success(data.message || 'Your PDF has been sent to your email!');
      setShowFormModal(false);
      setName('');
      setEmail('');
      setWhatsapp('');
    } catch (err) {
      console.error('Send PDF failed:', err);
      toast.error('Failed to send PDF. Please try again.');
    } finally {
      previewRef.current?.classList.remove('customize-pdf-export-mode');
      setSubmitting(false);
    }
  };

  return (
    <div className={`${overlayClass} customize-pdf-overlay`} onClick={onClose}>
      <div className={`${modalClass} customize-pdf-container`} onClick={(e) => e.stopPropagation()}>
        <div className={headerClass}>
          <h3 className={titleClass}>{pkg.package_name}</h3>
          <div className="customize-pdf-header-actions">
            <button
              type="button"
              className="customize-pdf-view-pdf-btn"
              onClick={() => setShowFormModal(true)}
              title="Send PDF to email"
            >
              <Send size={18} />
              Send to Email
            </button>
            <button className={closeClass} onClick={onClose} aria-label="Close">
              <X className={isMobile ? 'close-icon' : 'desktop-booking-modal-close-icon'} />
            </button>
          </div>
        </div>

        <div className="customize-pdf-content">
          <div className="customize-pdf-preview-wrapper" ref={previewRef}>
            {useCRMPreview && pkg.crm_package_id ? (
              <CRMPackageItineraryPreview
                crmPackageId={pkg.crm_package_id}
                package={pkg}
                persons={persons}
                isSoloTraveller={isSoloTraveller}
                selectedDeals={selectedDeals}
                selectedServices={selectedServices}
                selectedTransfers={selectedTransfers}
                packageBasePriceOverride={packageBasePriceOverride}
                hotelSurchargeTotal={hotelSurchargeTotal}
                extraBedChildNoBedTotal={extraBedChildNoBedTotal}
                effectiveNightsOverride={effectiveNights}
                effectiveDaysOverride={effectiveDays}
              />
            ) : (
              <CustomizePackagePreview
                package={pkg}
                persons={persons}
                isSoloTraveller={isSoloTraveller}
                selectedDeals={selectedDeals}
                selectedServices={selectedServices}
                selectedTransfers={selectedTransfers}
                effectiveNightsOverride={effectiveNights}
                effectiveDaysOverride={effectiveDays}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form modal - opens when "Send to Email" is clicked */}
      {showFormModal && (
        <div
          className={`${overlayClass} customize-pdf-form-overlay`}
          onClick={() => setShowFormModal(false)}
        >
          <div
            className={`${modalClass} customize-pdf-form-modal`}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 420 }}
          >
            <div className={headerClass}>
              <h3 className={titleClass}>Send PDF Brochure</h3>
              <button
                className={closeClass}
                onClick={() => setShowFormModal(false)}
                aria-label="Close"
              >
                <X className={isMobile ? 'close-icon' : 'desktop-booking-modal-close-icon'} />
              </button>
            </div>
            <div className={contentClass}>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                Enter your details to receive the brochure via email
              </p>

              <form
                onSubmit={handleSendPdf}
                className={isMobile ? 'mobile-input-selectors' : 'input-selectors'}
                style={{ flexDirection: 'column' }}
              >
                <div className={inputWrapperClass}>
                  <User className={inputIconClass} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ cursor: 'text' }}
                  />
                </div>
                <div className={inputWrapperClass}>
                  <Mail className={inputIconClass} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ cursor: 'text' }}
                  />
                </div>
                <div className={inputWrapperClass}>
                  <Phone className={inputIconClass} />
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    className={inputClass}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    style={{ cursor: 'text' }}
                  />
                </div>

                <div className={actionsClass} style={{ flexDirection: 'column', gap: 10 }}>
                  <button type="submit" disabled={submitting} className={submitButtonClass}>
                    {submitting ? 'Sending...' : 'Send Brochure'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="pdf-modal-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
