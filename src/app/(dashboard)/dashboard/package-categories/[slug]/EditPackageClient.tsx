'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import TipTapEditor from '@/components/ui/TipTapEditor';
import { toast } from 'sonner';
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from '@/lib/cloudinary';
import { usesBookingSlots, usesFlexibleDatePackages } from '@/lib/package-config';
import BookingSlotsCalendar from './BookingSlotsCalendar';
import FlexibleDatePackageDates from './FlexibleDatePackageDates';
import { parseDateStringToLocal } from '@/lib/utils';
import '../../dashboard.css';

type Pkg = {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  end_date?: string | null;
  travel_dates?: Array<{ id: string; value: string }> | string[] | null;
  booking_slots?: Array<{
    id: string;
    fromDate: string;
    toDate: string;
  }> | null;
  date_ranges?: Array<{
    id: string;
    fromDate: string;
    toDate: string;
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
    isSoldOut: boolean;
  }> | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  adult_discount_amount?: number | null;
  child_discount_amount?: number | null;
  infant_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  agent_discount?: number | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ heading: string; desc: string }> | null;
  thumbnail_image?: string | null;
};

export default function EditPackageClient({
  pkg,
  categoryId,
  categorySlug,
  categoryName,
}: {
  pkg: Pkg;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(pkg.package_name || '');
  const [description, setDescription] = useState(pkg.package_description || '');
  const [price, setPrice] = useState<string>(
    pkg.package_price != null ? String(pkg.package_price) : ''
  );
  const [days, setDays] = useState<string>('');
  const [nights, setNights] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('');
  const [travelDates, setTravelDates] = useState<
    Array<{ id: string; value: string }>
  >([]);
  // Booking slots (unavailable date ranges) for UAE Tours
  const [bookingSlots, setBookingSlots] = useState<
    Array<{ id: string; fromDate: string; toDate: string }>
  >([]);
  // Date ranges for flexible date packages (stored in packages.date_ranges JSONB column)
  const [dateRanges, setDateRanges] = useState<
    Array<{
      id: string;
      fromDate: string;
      toDate: string;
      adultPrice: number;
      childPrice: number;
      infantPrice: number;
      soloTravellerPrice?: number | null;
      isSoldOut: boolean;
    }>
  >([]);

  const usesSlots = usesBookingSlots(categorySlug);
  const usesFlexibleDate = usesFlexibleDatePackages(categorySlug);
  const [adultPrice, setAdultPrice] = useState<string>('');
  const [childPrice, setChildPrice] = useState<string>('');
  const [infantPrice, setInfantPrice] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [soloTravellerEnabled, setSoloTravellerEnabled] =
    useState<boolean>(false);
  const [soloTravellerPrice, setSoloTravellerPrice] = useState<string>('');
  const [withVisa, setWithVisa] = useState<boolean>(false);
  const [adultVisaPrice, setAdultVisaPrice] = useState<string>('');
  const [childVisaPrice, setChildVisaPrice] = useState<string>('');
  const [infantVisaPrice, setInfantVisaPrice] = useState<string>('');
  const [adultDiscountAmount, setAdultDiscountAmount] = useState<string>('');
  const [childDiscountAmount, setChildDiscountAmount] = useState<string>('');
  const [infantDiscountAmount, setInfantDiscountAmount] = useState<string>('');
  const [discountStartDate, setDiscountStartDate] = useState<string>('');
  const [discountEndDate, setDiscountEndDate] = useState<string>('');
  const [agentDiscount, setAgentDiscount] = useState<string>('');
  const [termsHtml, setTermsHtml] = useState<string>('');
  const [inclusionHtml, setInclusionHtml] = useState<string>('');
  const [exclusionHtml, setExclusionHtml] = useState<string>('');
  const [overview, setOverview] = useState<string>('');
  const [holidayDescHtml, setHolidayDescHtml] = useState<string>('');
  const [itinerary, setItinerary] = useState<
    Array<{ id: string; heading: string; desc: string }>
  >([
    {
      id: (crypto.randomUUID?.() || String(Date.now())) + '-0',
      heading: '',
      desc: '',
    },
  ]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailImagePreview, setThumbnailImagePreview] =
    useState<string>('');
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>('');
  const [originalThumbnailImageUrl, setOriginalThumbnailImageUrl] =
    useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Prefill fields when modal opens
  useEffect(() => {
    if (!open) return;
    if (pkg.package_days != null) setDays(String(pkg.package_days));
    if (pkg.package_nights != null) setNights(String(pkg.package_nights));
    if (pkg.end_date != null) setEndDate(pkg.end_date);
    if (pkg.adult_price != null) setAdultPrice(String(pkg.adult_price));
    if (pkg.child_price != null) setChildPrice(String(pkg.child_price));
    if (pkg.infant_price != null) setInfantPrice(String(pkg.infant_price));
    if (pkg.solo_traveller_enabled != null)
      setSoloTravellerEnabled(Boolean(pkg.solo_traveller_enabled));
    if (pkg.solo_traveller_price != null)
      setSoloTravellerPrice(String(pkg.solo_traveller_price));
    if (pkg.with_visa != null) setWithVisa(Boolean(pkg.with_visa));
    if (pkg.adult_visa_price != null) setAdultVisaPrice(String(pkg.adult_visa_price));
    if (pkg.child_visa_price != null) setChildVisaPrice(String(pkg.child_visa_price));
    if (pkg.infant_visa_price != null) setInfantVisaPrice(String(pkg.infant_visa_price));
    if (pkg.adult_discount_amount != null) setAdultDiscountAmount(String(pkg.adult_discount_amount));
    if (pkg.child_discount_amount != null) setChildDiscountAmount(String(pkg.child_discount_amount));
    if (pkg.infant_discount_amount != null) setInfantDiscountAmount(String(pkg.infant_discount_amount));
    if (pkg.agent_discount != null) setAgentDiscount(String(pkg.agent_discount));
    // Convert date strings to datetime-local format (YYYY-MM-DDTHH:mm)
    if (pkg.discount_start_date != null) {
      const startDate = new Date(pkg.discount_start_date);
      if (!isNaN(startDate.getTime())) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');
        setDiscountStartDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setDiscountStartDate(pkg.discount_start_date);
      }
    }
    if (pkg.discount_end_date != null) {
      const endDate = new Date(pkg.discount_end_date);
      if (!isNaN(endDate.getTime())) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        setDiscountEndDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setDiscountEndDate(pkg.discount_end_date);
      }
    }
    setTermsHtml(pkg.terms_html || '');
    setInclusionHtml(pkg.inclusion_html || '');
    setExclusionHtml(pkg.exclusion_html || '');
    setOverview(pkg.overview || '');
    setHolidayDescHtml(pkg.holiday_description_html || '');
    if (Array.isArray(pkg.itinerary)) {
      const norm = (
        pkg.itinerary as Array<{ id?: string; heading: string; desc: string }>
      ).map((it, idx) => ({
        id: it.id || crypto.randomUUID?.() || String(Date.now() + idx),
        heading: it.heading,
        desc: it.desc,
      }));
      setItinerary(norm);
    }
    if (usesSlots) {
      // Load booking slots for UAE Tours
      if (Array.isArray(pkg.booking_slots)) {
        setBookingSlots(pkg.booking_slots);
      } else {
        setBookingSlots([]);
      }
    } else if (usesFlexibleDate) {
      // Load date ranges from pkg.date_ranges (stored in packages table as JSONB)
      if (Array.isArray(pkg.date_ranges)) {
        const normalized = pkg.date_ranges.map((d: any) => ({
          id: d.id || crypto.randomUUID?.() || String(Date.now()),
          fromDate: d.fromDate,
          toDate: d.toDate,
          adultPrice: d.adultPrice || 0,
          childPrice: d.childPrice || 0,
          infantPrice: d.infantPrice || 0,
          soloTravellerPrice: d.soloTravellerPrice ?? null,
          isSoldOut: d.isSoldOut || false,
        }));
        setDateRanges(normalized);
      } else {
        setDateRanges([]);
      }
    } else {
      // Load travel dates for other categories
      if (Array.isArray(pkg.travel_dates)) {
        const normalized = (pkg.travel_dates as any[]).map((d: any) =>
          typeof d === 'string'
            ? { id: crypto.randomUUID?.() || String(Date.now()) + d, value: d }
            : d
        );
        setTravelDates(normalized);
      } else {
        setTravelDates([]);
      }
    }
    // Set thumbnail image
    const thumbUrl = pkg.thumbnail_image || '';
    setThumbnailImageUrl(thumbUrl);
    setOriginalThumbnailImageUrl(thumbUrl);
    setThumbnailImagePreview(thumbUrl || '');
    setThumbnailImage(null);
    setImageLoadError(false);
  }, [open, pkg]);

  const modalContent = open ? (
    <div className='modal_overlay' onClick={() => setOpen(false)}>
      <div className='modal category_modal' onClick={e => e.stopPropagation()}>
        <div className='modal_header'>
          <h4>Edit Package</h4>
          <button className='modal_close' onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className='modal_body'>
          {/* Basic Information Section */}
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
                <label>Thumbnail Image</label>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      toast.error('Please select a valid image file');
                      return;
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image size should be less than 5MB');
                      return;
                    }

                    setThumbnailImage(file);
                    setImageLoadError(false);
                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setThumbnailImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);

                    // Upload to Cloudinary
                    setIsUploadingImage(true);
                    try {
                      const url = await uploadImageToCloudinary(
                        file,
                        'packages'
                      );
                      setThumbnailImageUrl(url);
                      toast.success('Image uploaded successfully');
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : 'Failed to upload image'
                      );
                      setThumbnailImage(null);
                      // Revert to original preview
                      setThumbnailImagePreview(originalThumbnailImageUrl);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }}
                  disabled={isUploadingImage}
                />
                {thumbnailImagePreview &&
                  thumbnailImagePreview.trim() &&
                  !imageLoadError && (
                    <div className='image_preview_container'>
                      <img
                        src={thumbnailImagePreview}
                        alt='Thumbnail preview'
                        onError={() => {
                          setImageLoadError(true);
                        }}
                        onLoad={() => {
                          setImageLoadError(false);
                        }}
                        className='image_preview'
                      />
                      <button
                        type='button'
                        className='btn_remove_image'
                        onClick={() => {
                          setThumbnailImage(null);
                          setThumbnailImagePreview('');
                          setThumbnailImageUrl('');
                          setImageLoadError(false);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                {isUploadingImage && (
                  <p className='upload_status'>Uploading image...</p>
                )}
              </div>

              <div className='form_row full_width'>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Enter short description'
                  rows={3}
                />
              </div>

              <div className='form_row'>
                <label>Days</label>
                <select value={days} onChange={e => setDays(e.target.value)}>
                  <option value=''>Select days</option>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? 'Day' : 'Days'}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form_row'>
                <label>Nights</label>
                <select
                  value={nights}
                  onChange={e => setNights(e.target.value)}
                >
                  <option value=''>Select nights</option>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? 'Night' : 'Nights'}
                    </option>
                  ))}
                </select>
              </div>

              {usesSlots ? (
                <BookingSlotsCalendar
                  bookingSlots={bookingSlots}
                  onBookingSlotsChange={setBookingSlots}
                />
              ) : usesFlexibleDate ? (
                <FlexibleDatePackageDates
                  dateRanges={dateRanges}
                  onDateRangesChange={(newRanges) => {
                    console.log('EditPackageClient received dateRanges update:', JSON.stringify(newRanges, null, 2));
                    setDateRanges(newRanges);
                  }}
                  defaultAdultPrice={adultPrice || price}
                  defaultChildPrice={childPrice || price}
                  defaultInfantPrice={infantPrice || price}
                />
              ) : (
                <div className='form_row full_width'>
                  <label>Travel Dates</label>
                  <div className='date_input_group'>
                    <input
                      type='date'
                      value={travelDate}
                      onChange={e => setTravelDate(e.target.value)}
                    />
                    <button
                      type='button'
                      className='btn_add_date'
                      onClick={() => {
                        if (!travelDate) {
                          toast.error('Please select a date to add');
                          return;
                        }
                        if (travelDates.some(t => t.value === travelDate)) {
                          toast.error('Date already added');
                          return;
                        }
                        setTravelDates(prev => [
                          ...prev,
                          {
                            id: crypto.randomUUID?.() || String(Date.now()),
                            value: travelDate,
                          },
                        ]);
                        setTravelDate('');
                      }}
                    >
                      + Add Date
                    </button>
                  </div>
                  {travelDates.length > 0 && (
                    <div className='date_chips'>
                      {travelDates.map(d => {
                        const parsed = parseDateStringToLocal(d.value);
                        const display = parsed
                          ? parsed.toLocaleDateString()
                          : d.value;
                        return (
                          <span key={d.id} className='date_chip'>
                            {display}
                            <button
                              type='button'
                              onClick={() =>
                                setTravelDates(prev =>
                                  prev.filter(x => x.id !== d.id)
                                )
                              }
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section - Hidden for flexible date packages */}
          {!usesFlexibleDate && (
          <div className='form_section'>
            <h5 className='section_title'>Pricing</h5>
            <div className='form_grid pricing_grid'>
              <div className='form_row'>
                <label>Base Price *</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={price}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPrice(val);
                    }
                  }}
                  placeholder='999'
                />
              </div>

              <div className='form_row'>
                <label>Adult Price</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={adultPrice}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAdultPrice(val);
                    }
                  }}
                  placeholder='1299'
                />
              </div>

              <div className='form_row'>
                <label>Child Price</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={childPrice}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setChildPrice(val);
                    }
                  }}
                  placeholder='899'
                />
              </div>

              <div className='form_row'>
                <label>Infant Price</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={infantPrice}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setInfantPrice(val);
                    }
                  }}
                  placeholder='499'
                />
              </div>

              {/* Solo Traveller Option - Only for Offer Packages */}
              {categorySlug === 'offer-packages' && (
                <>
                  <div className='form_row full_width'>
                    <label>
                      <input
                        type='checkbox'
                        checked={soloTravellerEnabled}
                        onChange={e => setSoloTravellerEnabled(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Enable Solo Traveller Option
                    </label>
                  </div>

                  {soloTravellerEnabled && (
                    <div className='form_row'>
                      <label>Solo Traveller Price</label>
                        <input
                          type='text'
                          inputMode='numeric'
                          value={soloTravellerPrice}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setSoloTravellerPrice(val);
                            }
                          }}
                          placeholder='Solo traveller price'
                        />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          )}

          {/* Solo Traveller Option for Flexible Date Packages */}
          {usesFlexibleDate && (
          <div className='form_section'>
            <h5 className='section_title'>Solo Traveller Option</h5>
            <div className='form_grid pricing_grid'>
              <div className='form_row full_width'>
                <label>
                  <input
                    type='checkbox'
                    checked={soloTravellerEnabled}
                    onChange={e => setSoloTravellerEnabled(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Enable Solo Traveller Option
                </label>
              </div>
            </div>
          </div>
          )}

          {/* End Date for Flexible Date Packages */}
          {usesFlexibleDate && (
          <div className='form_section'>
            <h5 className='section_title'>Package End Date</h5>
            <div className='form_grid pricing_grid'>
              <div className='form_row'>
                <label>End Date *</label>
                <input
                  type='date'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          )}

          {/* Discount Section */}
          {usesFlexibleDate && (
          <div className='form_section'>
            <h5 className='section_title'>Discount Amount (Optional)</h5>
            <div className='form_grid pricing_grid'>
              <div className='form_row'>
                <label>Adult Discount (AED)</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={adultDiscountAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAdultDiscountAmount(val);
                    }
                  }}
                  placeholder='100'
                />
              </div>
              <div className='form_row'>
                <label>Child Discount (AED)</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={childDiscountAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setChildDiscountAmount(val);
                    }
                  }}
                  placeholder='50'
                />
              </div>
              <div className='form_row'>
                <label>Infant Discount (AED)</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={infantDiscountAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setInfantDiscountAmount(val);
                    }
                  }}
                  placeholder='25'
                />
              </div>
              <div className='form_row'>
                <label>Discount Start Date & Time</label>
                <input
                  type='datetime-local'
                  value={discountStartDate}
                  onChange={e => setDiscountStartDate(e.target.value)}
                />
              </div>
              <div className='form_row'>
                <label>Discount End Date & Time</label>
                <input
                  type='datetime-local'
                  value={discountEndDate}
                  onChange={e => setDiscountEndDate(e.target.value)}
                />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#9a3412', marginTop: '8px', marginBottom: 0 }}>
              Set discount amounts (AED) and date range to show a countdown timer on the website.
            </p>
          </div>
          )}

          {/* Agent Discount Section - Show for all package types */}
          <div className='form_section'>
            <h5 className='section_title'>Agent Discount (Optional)</h5>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Exclusive discount for agents with active subscriptions. This discount will be applied as a percentage to the total price (e.g., 10 for 10% discount).
            </p>
            <div className='form_grid pricing_grid'>
              <div className='form_row'>
                <label>Agent Discount (%)</label>
                <input
                  type='text'
                  inputMode='numeric'
                  value={agentDiscount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAgentDiscount(val);
                    }
                  }}
                  placeholder='10'
                />
              </div>
            </div>
          </div>

          {/* Visa Pricing Section */}
          <div className='form_section'>
            <h5 className='section_title'>Visa Pricing</h5>
            <div className='form_grid pricing_grid'>
              <div className='form_row full_width'>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                    <input
                      type='checkbox'
                      checked={withVisa}
                      onChange={e => setWithVisa(e.target.checked)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    />
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: withVisa ? '#f97316' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        borderColor: withVisa ? '#f97316' : '#d1d5db',
                      }}
                    >
                      {withVisa && (
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 14 14'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M11.6667 3.5L5.25 9.91667L2.33334 7'
                            stroke='white'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span>Enable Visa Option</span>
                </label>
              </div>

              {withVisa && (
                <>
                  <div className='form_row'>
                    <label>Adult Visa Price (AED) *</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={adultVisaPrice}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setAdultVisaPrice(val);
                        }
                      }}
                      placeholder='500'
                    />
                  </div>

                  <div className='form_row'>
                    <label>Child Visa Price (AED)</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={childVisaPrice}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setChildVisaPrice(val);
                        }
                      }}
                      placeholder='300'
                    />
                  </div>

                  <div className='form_row'>
                    <label>Infant Visa Price (AED)</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={infantVisaPrice}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setInfantVisaPrice(val);
                        }
                      }}
                      placeholder='200'
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Package Details Section */}
          <div className='form_section'>
            <h5 className='section_title'>Package Details</h5>

            <div className='form_row full_width'>
              <label>Overview</label>
              <textarea
                value={overview}
                onChange={e => setOverview(e.target.value)}
                placeholder='Enter package overview'
                rows={4}
              />
            </div>

            <div className='form_row full_width'>
              <label>Holiday Description</label>
              <TipTapEditor
                content={holidayDescHtml}
                onChange={setHolidayDescHtml}
                height={180}
              />
            </div>

            <div className='form_row full_width'>
              <label>Terms & Conditions</label>
              <TipTapEditor
                content={termsHtml}
                onChange={setTermsHtml}
                height={140}
              />
            </div>

            <div className='form_row full_width'>
              <label>Inclusions</label>
              <TipTapEditor
                content={inclusionHtml}
                onChange={setInclusionHtml}
                height={140}
              />
            </div>

            <div className='form_row full_width'>
              <label>Exclusions</label>
              <TipTapEditor
                content={exclusionHtml}
                onChange={setExclusionHtml}
                height={140}
              />
            </div>
          </div>

          {/* Itinerary Section */}
          <div className='form_section'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h5 className='section_title'>Itinerary</h5>
              <button
                type='button'
                className='btn_add_itinerary'
                onClick={() =>
                  setItinerary(prev => [
                    ...prev,
                    {
                      id:
                        crypto.randomUUID?.() ||
                        String(Date.now() + prev.length),
                      heading: '',
                      desc: '',
                    },
                  ])
                }
              >
                + Add Day
              </button>
            </div>

            <div className='itinerary_list'>
              {itinerary.map((item, idx) => (
                <div key={item.id} className='itinerary_item'>
                  <div className='itinerary_header'>
                    <span className='itinerary_day'>Day {idx + 1}</span>
                    {itinerary.length > 1 && (
                      <button
                        type='button'
                        className='btn_remove_itinerary'
                        onClick={() =>
                          setItinerary(prev =>
                            prev.filter(x => x.id !== item.id)
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className='form_row'>
                    <label>Heading</label>
                    <TipTapEditor
                      content={item.heading}
                      onChange={v => {
                        setItinerary(prev =>
                          prev.map(x =>
                            x.id === item.id ? { ...x, heading: v } : x
                          )
                        );
                      }}
                      height={100}
                    />
                  </div>
                  <div className='form_row'>
                    <label>Description</label>
                    <TipTapEditor
                      content={item.desc}
                      onChange={v => {
                        setItinerary(prev =>
                          prev.map(x =>
                            x.id === item.id ? { ...x, desc: v } : x
                          )
                        );
                      }}
                      height={140}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='modal_footer'>
          <button onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </button>
          <button
            className='btn_primary'
            disabled={
              !name.trim() || !price || Number.isNaN(Number(price)) || isPending
            }
            onClick={() =>
              startTransition(async () => {
                try {
                  if (!name.trim()) {
                    toast.error('Name is required');
                    return;
                  }
                  if (!price || Number.isNaN(Number(price))) {
                    toast.error('Valid price is required');
                    return;
                  }

                  // Handle thumbnail image: delete old if changed or removed
                  let finalThumbnailUrl = thumbnailImageUrl;
                  const imageChanged =
                    thumbnailImageUrl !== originalThumbnailImageUrl;

                  if (imageChanged) {
                    // If image was removed (empty string)
                    if (!thumbnailImageUrl && originalThumbnailImageUrl) {
                      // Delete old image from Cloudinary
                      await deleteImageFromCloudinary(
                        originalThumbnailImageUrl
                      );
                    }
                    // If new image was uploaded, old one should be deleted
                    else if (thumbnailImageUrl && originalThumbnailImageUrl) {
                      // Delete old image from Cloudinary
                      await deleteImageFromCloudinary(
                        originalThumbnailImageUrl
                      );
                    }
                  }

                  const res = await fetch('/api/packages', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: pkg.package_id,
                      name: name.trim(),
                      description: description.trim() || undefined,
                      price: Number(price),
                      category_id: categoryId,
                      days: days ? Number(days) : undefined,
                      nights: nights ? Number(nights) : undefined,
                      ...(usesSlots
                        ? { booking_slots: bookingSlots }
                        : usesFlexibleDate
                          ? (() => {
                              const mappedRanges = dateRanges.map((d: any) => ({
                                id: d.id,
                                fromDate: d.fromDate,
                                toDate: d.toDate,
                                adultPrice: d.adultPrice,
                                childPrice: d.childPrice,
                                infantPrice: d.infantPrice,
                                soloTravellerPrice: d.soloTravellerPrice ?? null,
                                isSoldOut: d.isSoldOut,
                              }));
                              console.log('EditPackage: dateRanges state:', dateRanges);
                              console.log('EditPackage: mapped date_ranges:', mappedRanges);
                              return { 
                                date_ranges: mappedRanges, 
                                end_date: endDate || undefined 
                              };
                            })()
                          : { travel_dates: travelDates }),
                      adult_price: adultPrice ? Number(adultPrice) : undefined,
                      child_price: childPrice ? Number(childPrice) : undefined,
                      infant_price: infantPrice
                        ? Number(infantPrice)
                        : undefined,
                      solo_traveller_enabled: soloTravellerEnabled,
                      solo_traveller_price:
                        soloTravellerEnabled && soloTravellerPrice
                          ? Number(soloTravellerPrice)
                          : undefined,
                      with_visa: withVisa,
                      adult_visa_price: withVisa && adultVisaPrice ? Number(adultVisaPrice) : undefined,
                      child_visa_price: withVisa && childVisaPrice ? Number(childVisaPrice) : undefined,
                      infant_visa_price: withVisa && infantVisaPrice ? Number(infantVisaPrice) : undefined,
                      adult_discount_amount: adultDiscountAmount && adultDiscountAmount.trim() !== '' && !Number.isNaN(Number(adultDiscountAmount)) ? Number(adultDiscountAmount) : null,
                      child_discount_amount: childDiscountAmount && childDiscountAmount.trim() !== '' && !Number.isNaN(Number(childDiscountAmount)) ? Number(childDiscountAmount) : null,
                      infant_discount_amount: infantDiscountAmount && infantDiscountAmount.trim() !== '' && !Number.isNaN(Number(infantDiscountAmount)) ? Number(infantDiscountAmount) : null,
                      discount_start_date: discountStartDate && discountStartDate.trim() !== '' ? discountStartDate : null,
                      discount_end_date: discountEndDate && discountEndDate.trim() !== '' ? discountEndDate : null,
                      agent_discount: agentDiscount && agentDiscount.trim() !== '' && !Number.isNaN(Number(agentDiscount)) ? Number(agentDiscount) : null,
                      terms_html: termsHtml || undefined,
                      inclusion_html: inclusionHtml || undefined,
                      exclusion_html: exclusionHtml || undefined,
                      overview: overview || undefined,
                      holiday_description_html: holidayDescHtml || undefined,
                      itinerary: itinerary,
                      thumbnail_image: imageChanged
                        ? finalThumbnailUrl || null
                        : undefined,
                    }),
                  });
                  if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw new Error(j?.error ?? 'Failed to update package');
                  }
                  setOpen(false);
                  router.refresh();
                  try {
                    window.dispatchEvent(new CustomEvent('packages:changed'));
                  } catch {}
                  toast.success('Package updated');
                } catch (e) {
                  console.error(e);
                  toast.error(
                    e instanceof Error ? e.message : 'Failed to update package'
                  );
                }
              })
            }
          >
            {isPending ? 'Saving...' : 'Save'}
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
