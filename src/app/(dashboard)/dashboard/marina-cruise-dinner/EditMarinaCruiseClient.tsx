'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import TipTapEditor from '@/components/ui/TipTapEditor';
import { toast } from 'sonner';
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from '@/lib/supabase-storage';
import { normalizePackageGallery } from '@/lib/package-gallery';
import MarinaBookableDatesSelector from './MarinaBookableDatesSelector';
import MarinaExcludedDatesSelector from './MarinaExcludedDatesSelector';
import MarinaAddonsEditor, { type MarinaAddon } from './MarinaAddonsEditor';
import MarinaRegistrationPricing from './MarinaRegistrationPricing';
import TourBookingDaysSelector from './TourBookingDaysSelector';
import { ALL_TOUR_BOOKING_DAYS } from '@/lib/tour-booking-days';
import '../dashboard.css';

type Pkg = {
  package_id: string;
  package_name: string;
  package_description: string | null;
  category?: string | null;
  timing?: string | null;
  package_price: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  registration_only?: boolean | null;
  registration_adult_price?: number | null;
  registration_child_price?: number | null;
  bookable_dates?: string[] | null;
  booking_days?: number[] | null;
  excluded_dates?: string[] | null;
  pickup_location?: string | null;
  status?: string | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  thumbnail_image?: string | null;
  gallery?: string[] | null;
  addons?: MarinaAddon[] | null;
};

function numericInput(val: string) {
  return val === '' || /^\d*\.?\d*$/.test(val);
}

export default function EditMarinaCruiseClient({ pkg }: { pkg: Pkg }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(pkg.package_name || '');
  const [description, setDescription] = useState(pkg.package_description || '');
  const [category, setCategory] = useState(pkg.category || '');
  const [timing, setTiming] = useState(pkg.timing || '');
  const [adultPrice, setAdultPrice] = useState(
    pkg.adult_price != null
      ? String(pkg.adult_price)
      : pkg.package_price != null
        ? String(pkg.package_price)
        : ''
  );
  const [childPrice, setChildPrice] = useState(
    pkg.child_price != null ? String(pkg.child_price) : ''
  );
  const [registrationOnly, setRegistrationOnly] = useState(false);
  const [registrationAdultPrice, setRegistrationAdultPrice] = useState('');
  const [registrationChildPrice, setRegistrationChildPrice] = useState('');
  const [status, setStatus] = useState(pkg.status || 'active');
  const [addons, setAddons] = useState<MarinaAddon[]>([]);
  const [bookableDates, setBookableDates] = useState<string[]>([]);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [bookingDays, setBookingDays] = useState<number[]>([
    ...ALL_TOUR_BOOKING_DAYS,
  ]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [termsHtml, setTermsHtml] = useState('');
  const [inclusionHtml, setInclusionHtml] = useState('');
  const [exclusionHtml, setExclusionHtml] = useState('');
  const [overview, setOverview] = useState('');
  const [holidayDescHtml, setHolidayDescHtml] = useState('');
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState('');
  const [thumbnailImagePreview, setThumbnailImagePreview] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const populateFromRecord = (data: Pkg) => {
    setName(data.package_name || '');
    setDescription(data.package_description || '');
    setCategory(data.category || '');
    setTiming(data.timing || '');
    setAdultPrice(
      data.adult_price != null
        ? String(data.adult_price)
        : data.package_price != null
          ? String(data.package_price)
          : ''
    );
    setChildPrice(data.child_price != null ? String(data.child_price) : '');
    setRegistrationOnly(Boolean(data.registration_only));
    setRegistrationAdultPrice(
      data.registration_adult_price != null
        ? String(data.registration_adult_price)
        : ''
    );
    setRegistrationChildPrice(
      data.registration_child_price != null
        ? String(data.registration_child_price)
        : ''
    );
    setStatus(data.status || 'active');
    setAddons(Array.isArray(data.addons) ? data.addons : []);
    setBookableDates(
      Array.isArray(data.bookable_dates) ? data.bookable_dates : []
    );
    setExcludedDates(
      Array.isArray(data.excluded_dates) ? data.excluded_dates : []
    );
    setBookingDays(
      Array.isArray(data.booking_days) ? data.booking_days : []
    );
    setPickupLocation(data.pickup_location || '');
    setTermsHtml(data.terms_html || '');
    setInclusionHtml(data.inclusion_html || '');
    setExclusionHtml(data.exclusion_html || '');
    setOverview(data.overview || '');
    setHolidayDescHtml(data.holiday_description_html || '');
    setThumbnailImageUrl(data.thumbnail_image || '');
    setThumbnailImagePreview(data.thumbnail_image || '');
    setGalleryImages(normalizePackageGallery(data.gallery));
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch(`/api/marina-cruise-dinners/${encodeURIComponent(pkg.package_id)}`)
      .then(res => res.json())
      .then(json => {
        if (!active) return;
        if (json.data) populateFromRecord(json.data);
      })
      .catch(() => {
        populateFromRecord(pkg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, pkg.package_id]);

  const handleGalleryUpload = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} size should be less than 5MB`);
        return;
      }
    }
    setIsUploadingGallery(true);
    try {
      const urls = await Promise.all(
        files.map(file => uploadImageToSupabase(file, 'packages'))
      );
      setGalleryImages(prev => [...prev, ...urls]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Package name is required');
      return;
    }
    if (!adultPrice || Number.isNaN(Number(adultPrice))) {
      toast.error('Adult price is required');
      return;
    }
    if (bookingDays.length === 0 && bookableDates.length === 0) {
      toast.error(
        'Select at least one booking day or add at least one specific date'
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/marina-cruise-dinners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pkg.package_id,
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || null,
          timing: timing.trim() || null,
          adult_price: Number(adultPrice),
          child_price:
            childPrice && !Number.isNaN(Number(childPrice))
              ? Number(childPrice)
              : null,
          registration_only: registrationOnly,
          registration_adult_price:
            registrationOnly &&
            registrationAdultPrice &&
            !Number.isNaN(Number(registrationAdultPrice))
              ? Number(registrationAdultPrice)
              : null,
          registration_child_price:
            registrationOnly &&
            registrationChildPrice &&
            !Number.isNaN(Number(registrationChildPrice))
              ? Number(registrationChildPrice)
              : null,
          status,
          addons: addons.length > 0 ? addons : [],
          bookable_dates: bookableDates,
          booking_days: bookingDays,
          excluded_dates: excludedDates,
          pickup_location: pickupLocation.trim() || null,
          terms_html: termsHtml,
          inclusion_html: inclusionHtml,
          exclusion_html: exclusionHtml,
          overview,
          holiday_description_html: holidayDescHtml,
          thumbnail_image: thumbnailImageUrl || null,
          gallery: galleryImages,
        }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData?.error ?? 'Failed to update package');
      }

      startTransition(() => setOpen(false));
      router.refresh();
      window.dispatchEvent(new CustomEvent('marina-cruise-dinners:changed'));
      toast.success('Marina cruise updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update package');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = open ? (
    <div className='modal_overlay' onClick={() => setOpen(false)}>
      <div className='modal category_modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Edit Marina Cruise</h4>
          <button className='modal_close' onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          {loading ? (
            <p className='table_loading'>Loading...</p>
          ) : (
            <>
              <div className='form_section'>
                <h5 className='section_title'>Basic Information</h5>
                <div className='form_grid'>
                  <div className='form_row full_width'>
                    <label>Package Name *</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className='form_row full_width'>
                    <label>Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className='form_row'>
                    <label>Category</label>
                    <input
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder='e.g. Dhow Cruise Dinner'
                    />
                  </div>
                  <div className='form_row'>
                    <label>Timing</label>
                    <input
                      value={timing}
                      onChange={e => setTiming(e.target.value)}
                      placeholder='e.g. 7:00 PM - 9:00 PM'
                    />
                  </div>
                  <div className='form_row'>
                    <label>Adult Price (AED) *</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={adultPrice}
                      onChange={e => {
                        if (numericInput(e.target.value))
                          setAdultPrice(e.target.value);
                      }}
                    />
                  </div>
                  <div className='form_row'>
                    <label>Child Price (AED)</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={childPrice}
                      onChange={e => {
                        if (numericInput(e.target.value))
                          setChildPrice(e.target.value);
                      }}
                    />
                  </div>
                  <div className='form_row'>
                    <label>Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value='active'>Active</option>
                      <option value='inactive'>Inactive</option>
                    </select>
                  </div>
                </div>
                <MarinaRegistrationPricing
                  enabled={registrationOnly}
                  adultPrice={registrationAdultPrice}
                  childPrice={registrationChildPrice}
                  onEnabledChange={checked => {
                    setRegistrationOnly(checked);
                    if (!checked) {
                      setRegistrationAdultPrice('');
                      setRegistrationChildPrice('');
                    }
                  }}
                  onAdultPriceChange={setRegistrationAdultPrice}
                  onChildPriceChange={setRegistrationChildPrice}
                />
              </div>

              <div className='form_section'>
                <h5 className='section_title'>Booking</h5>
                <TourBookingDaysSelector
                  selectedDays={bookingDays}
                  onSelectedDaysChange={setBookingDays}
                  allowEmpty
                />
                <MarinaBookableDatesSelector
                  dates={bookableDates}
                  onDatesChange={setBookableDates}
                />
                <MarinaExcludedDatesSelector
                  dates={excludedDates}
                  onDatesChange={setExcludedDates}
                />
                <div className='form_row full_width'>
                  <label>Tour Pickup Location</label>
                  <input
                    type='text'
                    value={pickupLocation}
                    onChange={e => setPickupLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className='form_section'>
                <h5 className='section_title'>Add-on Options</h5>
                <MarinaAddonsEditor addons={addons} onChange={setAddons} />
              </div>

              <div className='form_section'>
                <h5 className='section_title'>Media</h5>
                <div className='form_row full_width'>
                  <label>Thumbnail Image</label>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    disabled={isUploadingImage}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingImage(true);
                      try {
                        if (thumbnailImageUrl) {
                          await deleteImageFromSupabase(thumbnailImageUrl).catch(
                            () => {}
                          );
                        }
                        const url = await uploadImageToSupabase(file, 'packages');
                        setThumbnailImageUrl(url);
                        setThumbnailImagePreview(url);
                      } catch (error) {
                        toast.error('Failed to upload image');
                      } finally {
                        setIsUploadingImage(false);
                      }
                    }}
                  />
                  {thumbnailImagePreview && !imageLoadError && (
                    <div className='image_preview_container'>
                      <img
                        src={thumbnailImagePreview}
                        alt='Thumbnail'
                        className='image_preview'
                        onError={() => setImageLoadError(true)}
                      />
                    </div>
                  )}
                </div>
                <div className='form_row full_width'>
                  <label>Gallery Images</label>
                  <input
                    ref={galleryInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    disabled={isUploadingGallery}
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) handleGalleryUpload(files);
                    }}
                  />
                  {galleryImages.length > 0 && (
                    <div className='gallery_preview_grid'>
                      {galleryImages.map((url, idx) => (
                        <div key={url} className='gallery_preview_item'>
                          <img src={url} alt={`Gallery ${idx + 1}`} />
                          <button
                            type='button'
                            onClick={() =>
                              setGalleryImages(prev =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='form_section'>
                <h5 className='section_title'>Content</h5>
                <div className='form_row full_width'>
                  <label>Overview</label>
                  <textarea
                    value={overview}
                    onChange={e => setOverview(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className='form_row full_width'>
                  <label>Tour Description</label>
                  <TipTapEditor
                    content={holidayDescHtml}
                    onChange={setHolidayDescHtml}
                  />
                </div>
                <div className='form_row full_width'>
                  <label>Inclusions</label>
                  <TipTapEditor
                    content={inclusionHtml}
                    onChange={setInclusionHtml}
                  />
                </div>
                <div className='form_row full_width'>
                  <label>Exclusions</label>
                  <TipTapEditor
                    content={exclusionHtml}
                    onChange={setExclusionHtml}
                  />
                </div>
                <div className='form_row full_width'>
                  <label>Terms & Conditions</label>
                  <TipTapEditor content={termsHtml} onChange={setTermsHtml} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className='modal_footer'>
          <button onClick={() => setOpen(false)}>Cancel</button>
          <button
            className='btn_primary'
            onClick={handleSave}
            disabled={isSaving || isPending || loading || !name.trim() || !adultPrice}
          >
            {isSaving || isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button className='btn_secondary btn_small' onClick={() => setOpen(true)}>
        Edit
      </button>
      {typeof window !== 'undefined' && modalContent
        ? createPortal(modalContent, document.body)
        : modalContent}
    </>
  );
}
