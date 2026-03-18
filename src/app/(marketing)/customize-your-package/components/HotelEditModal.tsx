'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Bed, Baby } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import '@/app/(marketing)/category/[slug]/[packageId]/package-details.css';
import './HotelEditModal.css';

interface HotelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { rooms: number; extraBedCount: number; childNoBedCount: number }) => void;
  hotelName: string;
  roomType: string;
  nights: number;
  extraBedPrice: number;
  childNoBedPrice: number;
  initialRooms: number;
  initialExtraBedCount: number;
  initialChildNoBedCount: number;
  adults: number;
  children: number;
  infants: number;
}

export function HotelEditModal({
  isOpen,
  onClose,
  onSave,
  hotelName,
  roomType,
  nights,
  extraBedPrice,
  childNoBedPrice,
  initialRooms,
  initialExtraBedCount,
  initialChildNoBedCount,
  adults,
  children,
  infants,
}: HotelEditModalProps) {
  const isMobile = useIsMobile();
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

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const rooms = Math.max(1, parseInt((form.elements.namedItem('rooms') as HTMLInputElement)?.value || '1') || 1);
    const extraBedCount = Math.max(0, parseInt((form.elements.namedItem('extraBedCount') as HTMLInputElement)?.value || '0') || 0);
    const childNoBedCount = Math.max(0, parseInt((form.elements.namedItem('childNoBedCount') as HTMLInputElement)?.value || '0') || 0);
    onSave({ rooms, extraBedCount, childNoBedCount });
    onClose();
  };

  const modalContent = (
    <div
      className={`${overlayClass} hotel-edit-modal-overlay`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={`${modalClass} hotel-edit-modal`} onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className={headerClass}>
          <div>
            <h3 className={titleClass}>Edit Hotel — {hotelName}</h3>
            <p className="hotel-edit-modal-subtitle">
              {adults} Adult{adults !== 1 ? 's' : ''}, {children} Child{children !== 1 ? 'ren' : ''}, {infants} Infant{infants !== 1 ? 's' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className={closeClass} aria-label="Close">
            <X className={isMobile ? 'close-icon' : 'desktop-booking-modal-close-icon'} size={isMobile ? 20 : 24} />
          </button>
        </div>
        <div className={contentClass}>
          <form onSubmit={handleSubmit} className={isMobile ? 'mobile-input-selectors' : 'input-selectors'} style={{ flexDirection: 'column', display: 'flex', gap: 14 }}>
            <div className="hotel-edit-modal-room-info">
              <span className="hotel-edit-modal-room-type">{roomType || 'Room'}</span>
              <span className="hotel-edit-modal-nights">{nights} night{nights !== 1 ? 's' : ''}</span>
            </div>

            <p className="hotel-edit-modal-hint">Enter room details</p>

            <div className={inputWrapperClass}>
              <Building2 className={inputIconClass} size={18} />
              <input
                type="number"
                name="rooms"
                defaultValue={initialRooms}
                min={1}
                placeholder="No. of Rooms"
                className={inputClass}
                style={{ cursor: 'text' }}
              />
            </div>

            <div className={inputWrapperClass}>
              <Bed className={inputIconClass} size={18} />
              <input
                type="number"
                name="extraBedCount"
                defaultValue={initialExtraBedCount}
                min={0}
                placeholder="Extra Bed"
                className={inputClass}
                style={{ cursor: 'text' }}
              />
            </div>

            <div className={inputWrapperClass}>
              <Baby className={inputIconClass} size={18} />
              <input
                type="number"
                name="childNoBedCount"
                defaultValue={initialChildNoBedCount}
                min={0}
                placeholder="Child No Bed"
                className={inputClass}
                style={{ cursor: 'text' }}
              />
            </div>

            <div className={actionsClass} style={{ flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button type="submit" className={submitButtonClass}>
                Save
              </button>
              <button type="button" onClick={onClose} className="pdf-modal-cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
