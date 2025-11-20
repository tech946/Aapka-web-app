'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TipTapEditor from '@/components/ui/TipTapEditor';
import { toast } from 'sonner';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export default function AddPackageClient({
  categoryId,
}: {
  categoryId: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [status, setStatus] = useState('active');
  const [days, setDays] = useState<string>('');
  const [nights, setNights] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('');
  const [travelDates, setTravelDates] = useState<
    Array<{ id: string; value: string }>
  >([]);
  const [adultPrice, setAdultPrice] = useState<string>('');
  const [childPrice, setChildPrice] = useState<string>('');
  const [infantPrice, setInfantPrice] = useState<string>('');
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <button className='btn_primary' onClick={() => setOpen(true)}>
        Add Package
      </button>
      {open && (
        <div className='modal_overlay' onClick={() => setOpen(false)}>
          <div
            className='modal category_modal'
            onClick={e => e.stopPropagation()}
          >
            <div className='modal_header'>
              <h4>Add Package</h4>
              <button className='modal_close' onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className='modal_body'>
              <div className='form_row'>
                <label>Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder='Package name'
                />
              </div>
              <div className='form_row'>
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
                      setThumbnailImagePreview('');
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
                    <div style={{ marginTop: '12px' }}>
                      <img
                        src={thumbnailImagePreview}
                        alt='Thumbnail preview'
                        onError={() => {
                          setImageLoadError(true);
                        }}
                        onLoad={() => {
                          setImageLoadError(false);
                        }}
                        style={{
                          maxWidth: '300px',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      />
                      <button
                        type='button'
                        className='itinerary_remove_btn'
                        style={{ marginTop: '8px' }}
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
                  <p
                    style={{ marginTop: '8px', color: 'var(--text-secondary)' }}
                  >
                    Uploading image...
                  </p>
                )}
              </div>
              <div className='form_row'>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Short description'
                />
              </div>
              <div className='form_row'>
                <label>Days</label>
                <select value={days} onChange={e => setDays(e.target.value)}>
                  <option value=''>Select days</option>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
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
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className='form_row'>
                <label>Travel dates</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type='date'
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                  />
                  <button
                    className='itinerary_remove_btn'
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
                    Add date
                  </button>
                </div>
                {travelDates.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginTop: 8,
                    }}
                  >
                    {travelDates.map(d => (
                      <button
                        key={d.id}
                        className='itinerary_remove_btn'
                        onClick={() =>
                          setTravelDates(prev =>
                            prev.filter(x => x.id !== d.id)
                          )
                        }
                      >
                        {new Date(d.value).toLocaleDateString()} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className='form_row'>
                <label>Price</label>
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder='e.g. 999'
                />
              </div>
              <div className='form_row'>
                <label>Adult price</label>
                <input
                  value={adultPrice}
                  onChange={e => setAdultPrice(e.target.value)}
                  placeholder='e.g. 1299'
                />
              </div>
              <div className='form_row'>
                <label>Child price</label>
                <input
                  value={childPrice}
                  onChange={e => setChildPrice(e.target.value)}
                  placeholder='e.g. 899'
                />
              </div>
              <div className='form_row'>
                <label>Infant price</label>
                <input
                  value={infantPrice}
                  onChange={e => setInfantPrice(e.target.value)}
                  placeholder='e.g. 499'
                />
              </div>
              <div className='form_row'>
                <label>Terms & Conditions (bullet points)</label>
                <TipTapEditor
                  content={termsHtml}
                  onChange={setTermsHtml}
                  height={140}
                />
              </div>
              <div className='form_row'>
                <label>Inclusions (bullet points)</label>
                <TipTapEditor
                  content={inclusionHtml}
                  onChange={setInclusionHtml}
                  height={140}
                />
              </div>
              <div className='form_row'>
                <label>Exclusions (bullet points)</label>
                <TipTapEditor
                  content={exclusionHtml}
                  onChange={setExclusionHtml}
                  height={140}
                />
              </div>
              <div className='form_row'>
                <label>Overview</label>
                <textarea
                  value={overview}
                  onChange={e => setOverview(e.target.value)}
                />
              </div>
              <div className='form_row'>
                <label>Holiday Description</label>
                <TipTapEditor
                  content={holidayDescHtml}
                  onChange={setHolidayDescHtml}
                  height={180}
                />
              </div>
              <div className='form_row'>
                <label>Itinerary</label>
                {itinerary.map((item, idx) => (
                  <div key={item.id} className='itinerary_item'>
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
                    <div className='itinerary_actions'>
                      <button
                        className='itinerary_remove_btn'
                        onClick={() =>
                          setItinerary(prev =>
                            prev.filter(x => x.id !== item.id)
                          )
                        }
                      >
                        Remove item
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className='itinerary_remove_btn'
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
                  + Add Itinerary Item
                </button>
              </div>
              <div className='form_row'>
                <label>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value='active'>active</option>
                  <option value='inactive'>inactive</option>
                </select>
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
                  isPending
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
                      const res = await fetch('/api/packages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: name.trim(),
                          description: description.trim() || undefined,
                          price: Number(price),
                          status,
                          category_id: categoryId,
                          days: days ? Number(days) : undefined,
                          nights: nights ? Number(nights) : undefined,
                          travel_dates: travelDates,
                          adult_price: adultPrice
                            ? Number(adultPrice)
                            : undefined,
                          child_price: childPrice
                            ? Number(childPrice)
                            : undefined,
                          infant_price: infantPrice
                            ? Number(infantPrice)
                            : undefined,
                          terms_html: termsHtml || undefined,
                          inclusion_html: inclusionHtml || undefined,
                          exclusion_html: exclusionHtml || undefined,
                          overview: overview || undefined,
                          holiday_description_html:
                            holidayDescHtml || undefined,
                          itinerary: itinerary,
                          thumbnail_image: thumbnailImageUrl || undefined,
                        }),
                      });
                      if (!res.ok) {
                        const j = await res.json().catch(() => ({}));
                        throw new Error(j?.error ?? 'Failed to add package');
                      }
                      setOpen(false);
                      // Reset form
                      setName('');
                      setDescription('');
                      setPrice('');
                      setDays('');
                      setNights('');
                      setTravelDates([]);
                      setAdultPrice('');
                      setChildPrice('');
                      setInfantPrice('');
                      setTermsHtml('');
                      setInclusionHtml('');
                      setExclusionHtml('');
                      setOverview('');
                      setHolidayDescHtml('');
                      setItinerary([
                        {
                          id:
                            (crypto.randomUUID?.() || String(Date.now())) +
                            '-0',
                          heading: '',
                          desc: '',
                        },
                      ]);
                      setThumbnailImage(null);
                      setThumbnailImagePreview('');
                      setThumbnailImageUrl('');
                      setImageLoadError(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      // Refresh current route to show the new package
                      router.refresh();
                      // Also notify list to refetch
                      try {
                        window.dispatchEvent(
                          new CustomEvent('packages:changed')
                        );
                      } catch {}
                      toast.success('Package added');
                    } catch (e) {
                      console.error(e);
                      toast.error(
                        e instanceof Error ? e.message : 'Failed to add package'
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
      )}
    </>
  );
}
