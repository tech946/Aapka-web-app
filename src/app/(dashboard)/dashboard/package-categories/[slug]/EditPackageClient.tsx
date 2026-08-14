'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import TipTapEditor from '@/components/ui/TipTapEditor';
import { toast } from 'sonner';
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  uploadPdfToSupabase,
  deletePdfFromSupabase,
} from '@/lib/supabase-storage';
import { usesBookingSlots, usesFlexibleDatePackages, supportsListingPageToggle } from '@/lib/package-config';
import {
  DEFAULT_ACCEPT_PAYMENT,
  normalizeAcceptPayment,
  type AcceptPayment,
} from '@/lib/package-payment';
import BookingSlotsCalendar from './BookingSlotsCalendar';
import TourBookingDaysSelector from './TourBookingDaysSelector';
import FlexibleDatePackageDates from './FlexibleDatePackageDates';
import { ALL_TOUR_BOOKING_DAYS } from '@/lib/tour-booking-days';
import { normalizePdfUrl } from '@/lib/package-gallery';
import { mapPackageToEditForm } from '@/lib/package-form';
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
  booking_days?: number[] | null;
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
  accept_payment?: string | null;
  min_adults?: number | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ heading: string; desc: string }> | null;
  thumbnail_image?: string | null;
  gallery?: string[] | null;
  pdf_url?: string | null;
  pickup_location?: string | null;
  show_listing_page?: boolean | null;
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
  const [bookingDays, setBookingDays] = useState<number[]>([
    ...ALL_TOUR_BOOKING_DAYS,
  ]);
  const [pickupLocation, setPickupLocation] = useState('');
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
  const showListingToggle = supportsListingPageToggle(categorySlug);
  const [showListingPage, setShowListingPage] = useState<boolean>(true);
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
  // Checkout payment rule; falls back to 'half' for rows saved before this existed
  const [acceptPayment, setAcceptPayment] = useState<AcceptPayment>(
    DEFAULT_ACCEPT_PAYMENT
  );
  const [minAdults, setMinAdults] = useState<string>('1');
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
  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  // Gallery images state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [originalGalleryImages, setOriginalGalleryImages] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const router = useRouter();

  const handleGalleryUpload = async (files: File[]) => {
    // Validate all files
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
      const uploadPromises = files.map(file =>
        uploadImageToSupabase(file, 'packages/gallery')
      );
      const urls = await Promise.all(uploadPromises);
      setGalleryImages(prev => [...prev, ...urls]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload images'
      );
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const applyFormData = (source: Pkg) => {
    const form = mapPackageToEditForm(source, {
      usesSlots,
      usesFlexibleDate,
    });

    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setDays(form.days);
    setNights(form.nights);
    setEndDate(form.endDate);
    setAdultPrice(form.adultPrice);
    setChildPrice(form.childPrice);
    setInfantPrice(form.infantPrice);
    setSoloTravellerEnabled(form.soloTravellerEnabled);
    setSoloTravellerPrice(form.soloTravellerPrice);
    setWithVisa(form.withVisa);
    setShowListingPage(form.showListingPage);
    setAdultVisaPrice(form.adultVisaPrice);
    setChildVisaPrice(form.childVisaPrice);
    setInfantVisaPrice(form.infantVisaPrice);
    setAdultDiscountAmount(form.adultDiscountAmount);
    setChildDiscountAmount(form.childDiscountAmount);
    setInfantDiscountAmount(form.infantDiscountAmount);
    setDiscountStartDate(form.discountStartDate);
    setDiscountEndDate(form.discountEndDate);
    setAgentDiscount(form.agentDiscount);
    setAcceptPayment(normalizeAcceptPayment(source.accept_payment));
    setMinAdults(form.minAdults);
    setTermsHtml(form.termsHtml);
    setInclusionHtml(form.inclusionHtml);
    setExclusionHtml(form.exclusionHtml);
    setOverview(form.overview);
    setHolidayDescHtml(form.holidayDescHtml);
    setItinerary(form.itinerary);
    setBookingSlots(form.bookingSlots);
    setBookingDays(form.bookingDays);
    setPickupLocation(form.pickupLocation);
    setDateRanges(form.dateRanges);
    setTravelDates(form.travelDates);
    setThumbnailImageUrl(form.thumbnailImageUrl);
    setOriginalThumbnailImageUrl(form.thumbnailImageUrl);
    setThumbnailImagePreview(form.thumbnailImageUrl);
    setThumbnailImage(null);
    setImageLoadError(false);
    setGalleryImages(form.galleryImages);
    setOriginalGalleryImages(form.galleryImages);
    setPdfUrl(form.pdfUrl);
    setOriginalPdfUrl(form.pdfUrl);
    setPdfFileName(form.pdfFileName);
  };

  // Load the latest package data (including gallery) when the modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadPackageForEdit() {
      setIsLoadingForm(true);
      try {
        const res = await fetch(
          `/api/packages/${encodeURIComponent(pkg.package_id)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && json.data) {
          applyFormData(json.data as Pkg);
        } else {
          applyFormData(pkg);
        }
      } catch (error) {
        console.error('Failed to load package for edit:', error);
        if (!cancelled) applyFormData(pkg);
      } finally {
        if (!cancelled) setIsLoadingForm(false);
      }
    }

    loadPackageForEdit();

    return () => {
      cancelled = true;
    };
  }, [open, pkg.package_id]);

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

                    // Upload to Supabase storage
                    setIsUploadingImage(true);
                    try {
                      const url = await uploadImageToSupabase(
                        file,
                        'packages'
                      );
                      // Delete previous image from storage when replacing (scalability)
                      if (thumbnailImageUrl) {
                        try {
                          await deleteImageFromSupabase(thumbnailImageUrl);
                        } catch (e) {
                          console.error(e);
                        }
                      }
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
                        onClick={async () => {
                          if (thumbnailImageUrl) {
                            try {
                              await deleteImageFromSupabase(thumbnailImageUrl);
                            } catch (e) {
                              console.error(e);
                            }
                          }
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
                <label>Gallery Images</label>
                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    cursor: isUploadingGallery ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isUploadingGallery ? 0.6 : 1,
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isUploadingGallery) {
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.backgroundColor = '#fff7ed';
                    }
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onDrop={async e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    if (isUploadingGallery) return;
                    const files = Array.from(e.dataTransfer.files || []).filter(
                      file => file.type.startsWith('image/')
                    );
                    if (files.length === 0) return;
                    await handleGalleryUpload(files);
                  }}
                  onClick={() => {
                    if (!isUploadingGallery) {
                      galleryInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={galleryInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      await handleGalleryUpload(files);
                    }}
                    disabled={isUploadingGallery}
                    style={{ display: 'none' }}
                  />
                  {isUploadingGallery ? (
                    <div>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          border: '3px solid #f3f4f6',
                          borderTop: '3px solid #f97316',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 12px',
                        }}
                      />
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                        Uploading images...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg
                        width='48'
                        height='48'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='#9ca3af'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        style={{ margin: '0 auto 12px', display: 'block' }}
                      >
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                        <polyline points='17 8 12 3 7 8' />
                        <line x1='12' y1='3' x2='12' y2='15' />
                      </svg>
                      <p style={{ color: '#374151', margin: '0 0 4px', fontSize: '14px', fontWeight: '500' }}>
                        Click to upload or drag and drop
                      </p>
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>
                        Multiple images supported (Max 5MB each)
                      </p>
                    </div>
                  )}
                </div>
                {galleryImages.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: '12px',
                      marginTop: '16px',
                    }}
                  >
                    {galleryImages.map((url, index) => (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fff',
                          aspectRatio: '1',
                        }}
                      >
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <button
                          type='button'
                          onClick={async e => {
                            e.stopPropagation();
                            const imageToRemove = url;
                            // Remove from state immediately
                            setGalleryImages(prev => prev.filter((_, i) => i !== index));
                            // If it's a newly uploaded image (not in original), delete from Supabase storage immediately
                            // If it's an original image, it will be deleted when saved
                            if (!originalGalleryImages.includes(imageToRemove)) {
                              try {
                                await deleteImageFromSupabase(imageToRemove);
                                toast.success('Image removed');
                              } catch (error) {
                                console.error('Error deleting gallery image:', error);
                                toast.error('Failed to delete image from storage');
                              }
                            } else {
                              toast.success('Image will be removed when you save');
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.95)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            lineHeight: '1',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.95)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title='Remove image'
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='form_row full_width'>
                <label>PDF Brochure / Itinerary (Optional)</label>
                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    textAlign: 'center',
                  }}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <input
                    ref={pdfInputRef}
                    type='file'
                    accept='application/pdf,.pdf'
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.type !== 'application/pdf') {
                        toast.error('Please select a PDF file');
                        return;
                      }
                      if (file.size > 25 * 1024 * 1024) {
                        toast.error('PDF size should be less than 25MB');
                        return;
                      }
                      setIsUploadingPdf(true);
                      try {
                        const url = await uploadPdfToSupabase(file, 'packages');
                        if (pdfUrl) {
                          try {
                            await deletePdfFromSupabase(pdfUrl);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                        setPdfUrl(url);
                        setPdfFileName(file.name);
                        toast.success('PDF uploaded successfully');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Failed to upload PDF');
                      } finally {
                        setIsUploadingPdf(false);
                        if (pdfInputRef.current) pdfInputRef.current.value = '';
                      }
                    }}
                  />
                  {isUploadingPdf ? (
                    <p style={{ color: '#6b7280', margin: 0 }}>Uploading PDF...</p>
                  ) : pdfUrl ? (
                    <div style={{ width: '100%' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#dc2626' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                            <polyline points='14 2 14 8 20 8' />
                            <line x1='16' y1='13' x2='8' y2='13' />
                            <line x1='16' y1='17' x2='8' y2='17' />
                            <polyline points='10 9 9 9 8 9' />
                          </svg>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '14px' }}>{pdfFileName || 'PDF Document'}</p>
                            <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>Uploaded successfully</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                          <a
                            href={pdfUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', background: '#eff6ff', fontWeight: 500 }}
                          >
                            Open in new tab
                          </a>
                          <button
                            type='button'
                            onClick={() => pdfInputRef.current?.click()}
                            style={{ color: '#6b7280', background: '#f3f4f6', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Replace
                          </button>
                          <button
                            type='button'
                            onClick={() => { setPdfUrl(''); setPdfFileName(''); toast.success('PDF removed'); }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={`${pdfUrl}#toolbar=0`}
                        title='PDF Preview'
                        style={{ width: '100%', height: '360px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }}
                      />
                    </div>
                  ) : (
                    <>
                      <p style={{ color: '#374151', margin: '0 0 4px', fontSize: '14px' }}>Click to upload PDF (Max 25MB)</p>
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '12px' }}>Brochure, itinerary, or other documents</p>
                    </>
                  )}
                </div>
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

              {showListingToggle && (
                <div className='form_row full_width'>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                      <input
                        type='checkbox'
                        checked={showListingPage}
                        onChange={e => setShowListingPage(e.target.checked)}
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
                          backgroundColor: showListingPage ? '#f97316' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          borderColor: showListingPage ? '#f97316' : '#d1d5db',
                        }}
                      >
                        {showListingPage && (
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
                    <span>Show on Listing Page</span>
                  </label>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    When enabled, this package appears on the public category listing page.
                  </p>
                </div>
              )}

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

              <div className='form_row'>
                <label>Minimum Adults *</label>
                <select
                  value={minAdults}
                  onChange={e => setMinAdults(e.target.value)}
                  required
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? 'Adult' : 'Adults'}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Minimum number of adults required to book this package
                </span>
              </div>

              {usesSlots ? (
                <>
                  <TourBookingDaysSelector
                    selectedDays={bookingDays}
                    onSelectedDaysChange={setBookingDays}
                  />
                  <div className='form_row full_width'>
                    <label>Tour Pickup Location</label>
                    <input
                      type='text'
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      placeholder='e.g. Dubai Marina Hotel lobby'
                    />
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        marginTop: '4px',
                      }}
                    >
                      Tour only pickup — shown read-only at checkout
                    </span>
                  </div>
                  <BookingSlotsCalendar
                    bookingSlots={bookingSlots}
                    onBookingSlotsChange={setBookingSlots}
                  />
                </>
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

          {/* Checkout Payment Rule */}
          <div className='form_section'>
            <h5 className='section_title'>Checkout Payment</h5>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Choose what customers may pay at checkout for this package. Tours,
              Marina Cruise and agent bookings are always full payment
              regardless of this setting.
            </p>
            <div className='form_grid pricing_grid'>
              <div className='form_row'>
                <label>Accepted Payment</label>
                <select
                  value={acceptPayment}
                  onChange={e =>
                    setAcceptPayment(e.target.value === 'full' ? 'full' : 'half')
                  }
                >
                  <option value='half'>Half (50%) or Full — default</option>
                  <option value='full'>Full payment only</option>
                </select>
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
              !name.trim() ||
              !price ||
              Number.isNaN(Number(price)) ||
              isPending ||
              isLoadingForm
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
                      // Delete old image from Supabase storage
                      await deleteImageFromSupabase(
                        originalThumbnailImageUrl
                      );
                    }
                    // If new image was uploaded, old one should be deleted
                    else if (thumbnailImageUrl && originalThumbnailImageUrl) {
                      // Delete old image from Supabase storage
                      await deleteImageFromSupabase(
                        originalThumbnailImageUrl
                      );
                    }
                  }

                  // Handle PDF: delete old PDF from storage if removed or replaced
                  if (originalPdfUrl && pdfUrl !== originalPdfUrl) {
                    try {
                      await deletePdfFromSupabase(originalPdfUrl);
                    } catch (error) {
                      console.error('Error deleting old PDF:', error);
                    }
                  }

                  // Handle gallery images: delete removed images from Supabase storage
                  // Find images that were in the original but are no longer in the current gallery
                  const removedGalleryImages = originalGalleryImages.filter(
                    url => !galleryImages.includes(url)
                  );
                  // Delete all removed images from Supabase storage
                  for (const url of removedGalleryImages) {
                    try {
                      await deleteImageFromSupabase(url);
                    } catch (error) {
                      console.error('Error deleting removed gallery image:', error);
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
                        ? {
                            booking_slots: bookingSlots,
                            booking_days: bookingDays,
                            pickup_location: pickupLocation.trim() || null,
                          }
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
                      accept_payment: acceptPayment,
                      min_adults: minAdults ? Math.max(1, Number(minAdults)) : 1,
                      terms_html: termsHtml || undefined,
                      inclusion_html: inclusionHtml || undefined,
                      exclusion_html: exclusionHtml || undefined,
                      overview: overview || undefined,
                      holiday_description_html: holidayDescHtml || undefined,
                      itinerary: itinerary,
                      thumbnail_image: imageChanged
                        ? finalThumbnailUrl || null
                        : undefined,
                      pdf_url: normalizePdfUrl(pdfUrl) || null,
                      gallery: galleryImages.length > 0 ? galleryImages : [],
                      show_listing_page: showListingToggle ? showListingPage : undefined,
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
            {isPending ? 'Saving...' : isLoadingForm ? 'Loading...' : 'Save'}
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
