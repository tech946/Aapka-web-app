'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import TipTapEditor from '@/components/ui/TipTapEditor';
import { toast } from 'sonner';
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from '@/lib/supabase-storage';
import MarinaBookableDatesSelector from './MarinaBookableDatesSelector';
import MarinaAddonsEditor, { type MarinaAddon } from './MarinaAddonsEditor';
import MarinaRegistrationPricing from './MarinaRegistrationPricing';
import TourBookingDaysSelector from './TourBookingDaysSelector';
import { ALL_TOUR_BOOKING_DAYS } from '@/lib/tour-booking-days';
import '../dashboard.css';

function numericInput(val: string) {
  return val === '' || /^\d*\.?\d*$/.test(val);
}

export default function AddMarinaCruiseClient() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [timing, setTiming] = useState('');
  const [adultPrice, setAdultPrice] = useState('');
  const [childPrice, setChildPrice] = useState('');
  const [registrationOnly, setRegistrationOnly] = useState(false);
  const [registrationAdultPrice, setRegistrationAdultPrice] = useState('');
  const [registrationChildPrice, setRegistrationChildPrice] = useState('');
  const [addons, setAddons] = useState<MarinaAddon[]>([]);
  const [bookableDates, setBookableDates] = useState<string[]>([]);
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setTiming('');
    setAdultPrice('');
    setChildPrice('');
    setRegistrationOnly(false);
    setRegistrationAdultPrice('');
    setRegistrationChildPrice('');
    setAddons([]);
    setBookableDates([]);
    setBookingDays([...ALL_TOUR_BOOKING_DAYS]);
    setPickupLocation('');
    setTermsHtml('');
    setInclusionHtml('');
    setExclusionHtml('');
    setOverview('');
    setHolidayDescHtml('');
    setThumbnailImageUrl('');
    setThumbnailImagePreview('');
    setImageLoadError(false);
    setGalleryImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

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
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        timing: timing.trim() || undefined,
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
        addons: addons.length > 0 ? addons : [],
        bookable_dates: bookableDates,
        booking_days: bookingDays,
        pickup_location: pickupLocation.trim() || null,
        terms_html: termsHtml || undefined,
        inclusion_html: inclusionHtml || undefined,
        exclusion_html: exclusionHtml || undefined,
        overview: overview || undefined,
        holiday_description_html: holidayDescHtml || undefined,
        thumbnail_image: thumbnailImageUrl || undefined,
        gallery: galleryImages.length > 0 ? galleryImages : undefined,
      };

      const res = await fetch('/api/marina-cruise-dinners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData?.error ?? 'Failed to add package');
      }

      startTransition(() => {
        setOpen(false);
        resetForm();
      });
      router.refresh();
      window.dispatchEvent(new CustomEvent('marina-cruise-dinners:changed'));
      toast.success('Marina cruise added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add package');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = open ? (
    <div className='modal_overlay' onClick={() => setOpen(false)}>
      <div className='modal category_modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Add Marina Cruise</h4>
          <button className='modal_close' onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          <div className='form_section'>
            <h5 className='section_title'>Basic Information</h5>
            <div className='form_grid'>
              <div className='form_row full_width'>
                <label>Package Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder='Enter package name'
                />
              </div>
              <div className='form_row full_width'>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Short description'
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
                    if (numericInput(e.target.value)) setAdultPrice(e.target.value);
                  }}
                  placeholder='999'
                />
              </div>
              <div className='form_row'>
                <label>Child Price (AED)</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={childPrice}
                  onChange={e => {
                    if (numericInput(e.target.value)) setChildPrice(e.target.value);
                  }}
                  placeholder='499'
                />
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
            <div className='form_row full_width'>
              <label>Tour Pickup Location</label>
              <input
                type='text'
                value={pickupLocation}
                onChange={e => setPickupLocation(e.target.value)}
                placeholder='e.g. Dubai Marina Hotel lobby'
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
                  if (!file.type.startsWith('image/')) {
                    toast.error('Please select a valid image file');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Image size should be less than 5MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setThumbnailImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                  setIsUploadingImage(true);
                  try {
                    if (thumbnailImageUrl) {
                      await deleteImageFromSupabase(thumbnailImageUrl).catch(
                        () => {}
                      );
                    }
                    const url = await uploadImageToSupabase(file, 'packages');
                    setThumbnailImageUrl(url);
                    toast.success('Image uploaded');
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Failed to upload image'
                    );
                    setThumbnailImagePreview('');
                  } finally {
                    setIsUploadingImage(false);
                  }
                }}
              />
              {thumbnailImagePreview && !imageLoadError && (
                <div className='image_preview_container'>
                  <img
                    src={thumbnailImagePreview}
                    alt='Thumbnail preview'
                    className='image_preview'
                    onError={() => setImageLoadError(true)}
                    onLoad={() => setImageLoadError(false)}
                  />
                  <button
                    type='button'
                    className='btn_remove_image'
                    onClick={async () => {
                      if (thumbnailImageUrl) {
                        await deleteImageFromSupabase(thumbnailImageUrl).catch(
                          () => {}
                        );
                      }
                      setThumbnailImageUrl('');
                      setThumbnailImagePreview('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remove Image
                  </button>
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
                        onClick={async () => {
                          await deleteImageFromSupabase(url).catch(() => {});
                          setGalleryImages(prev =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
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
              <TipTapEditor content={holidayDescHtml} onChange={setHolidayDescHtml} />
            </div>
            <div className='form_row full_width'>
              <label>Inclusions</label>
              <TipTapEditor content={inclusionHtml} onChange={setInclusionHtml} />
            </div>
            <div className='form_row full_width'>
              <label>Exclusions</label>
              <TipTapEditor content={exclusionHtml} onChange={setExclusionHtml} />
            </div>
            <div className='form_row full_width'>
              <label>Terms & Conditions</label>
              <TipTapEditor content={termsHtml} onChange={setTermsHtml} />
            </div>
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={() => setOpen(false)}>Cancel</button>
          <button
            className='btn_primary'
            onClick={handleSave}
            disabled={isSaving || isPending || !name.trim() || !adultPrice}
          >
            {isSaving || isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button className='btn_primary' onClick={() => setOpen(true)}>
        Add Marina Cruise
      </button>
      {typeof window !== 'undefined' && modalContent
        ? createPortal(modalContent, document.body)
        : modalContent}
    </>
  );
}
