'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCategoriesWithPackages, usePackagesByCategory } from '@/hooks/use-marketing-queries';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ChevronDown,
  Plus,
  Minus,
  Star,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import {
  generateShortSlug,
  parseDateStringToLocal,
  getEarliestAvailableDateMonth,
} from '@/lib/utils';
import {
  usesFlexibleDatePackagesByName,
  usesBookingSlotsByName,
} from '@/lib/package-config';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import 'react-day-picker/dist/style.css';
import './home.css';

interface PackageCategory {
  category_id?: string;
  id?: string;
  categoryId?: string;
  name: string;
  packagetypeid?: number | null;
  packagetypename?: string | null;
  [key: string]: any; // Allow for other fields
}

interface DateRange {
  id: string;
  fromDate: string;
  toDate: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  soloTravellerPrice?: number | null;
  isSoldOut: boolean;
}

interface Package {
  package_id: string;
  package_name: string;
  package_price: number;
  package_days?: number | null;
  package_nights?: number | null;
  travel_dates?: Array<{ id: string; value: string }> | string[] | null;
  date_ranges?: DateRange[] | null;
  end_date?: string | null;
}

interface PersonsCount {
  adult: number;
  child: number;
  infant: number;
}

export default function BannerSection() {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [month, setMonth] = useState<Date>(new Date());
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [persons, setPersons] = useState<PersonsCount>({
    adult: 2, // Default to 2 adults
    child: 0,
    infant: 0,
  });

  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPersonsDropdown, setShowPersonsDropdown] = useState(false);

  const packageDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const personsDropdownRef = useRef<HTMLDivElement>(null);

  // Cached categories with packages (no refetch on navigation back to home)
  const { data: categoriesWithPackagesData = [], categories } = useCategoriesWithPackages(100);
  const catsWithPkgs = (categoriesWithPackagesData ?? []) as PackageCategory[];
  const allCats = (categories ?? []) as PackageCategory[];
  const hasValidCategory =
    activeCategoryId &&
    activeCategoryId !== 'undefined' &&
    activeCategoryId !== 'null';
  const { data: packagesData, isLoading: loadingPackages } = usePackagesByCategory({
    categoryId: hasValidCategory ? activeCategoryId : undefined,
    limit: 100,
    status: 'active',
  });

  // Sync categories and set active category on first load
  useEffect(() => {
    if (catsWithPkgs.length > 0 && !activeCategoryId) {
      const first = catsWithPkgs[0];
      const id = first.category_id ?? first.id ?? first.categoryId;
      if (id) setActiveCategoryId(String(id));
    }
  }, [catsWithPkgs, activeCategoryId]);

  // Use cached packages data
  const packages = ((packagesData?.data ?? []) as unknown) as Package[];
  useEffect(() => {
    if (!hasValidCategory) {
      setSelectedPackage(null);
    }
  }, [hasValidCategory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        packageDropdownRef.current &&
        !packageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPackageDropdown(false);
      }
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        personsDropdownRef.current &&
        !personsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPersonsDropdown(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: string | null | undefined) => {
    if (!categoryId || categoryId === 'undefined' || categoryId === 'null') return;
    setSelectedPackage(null);
    setShowPackageDropdown(false);
    setSelectedDate(undefined);
    setSelectedDateString('');
    setShowDatePicker(false);
    setShowDateDropdown(false);
    setActiveCategoryId(categoryId);
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPackageDropdown(false);
    // Reset date selection when package changes
    setSelectedDate(undefined);
    setSelectedDateString('');
    // If this is a flexible date package, set month to earliest available date
    if (isFlexibleDatePackage() && pkg.date_ranges) {
      const earliestMonth = getEarliestAvailableDateMonth(pkg.date_ranges);
      setMonth(earliestMonth);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setShowDatePicker(false);
    }
  };

  const handleDateStringSelect = (dateString: string) => {
    setSelectedDateString(dateString);
    const parsed = parseDateStringToLocal(dateString);
    setSelectedDate(parsed || undefined);
    setShowDateDropdown(false);
  };

  // Get active category's packagetypeid
  const getActiveCategoryType = (): number | null => {
    if (!activeCategoryId) return null;
    const activeCategory =
      catsWithPkgs.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      ) ?? allCats.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      );
    return activeCategory?.packagetypeid ?? null;
  };

  // Check if active category uses flexible date packages
  const isFlexibleDatePackage = (): boolean => {
    if (!activeCategoryId) return false;
    const activeCategory =
      catsWithPkgs.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      ) ?? allCats.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      );
    return activeCategory
      ? usesFlexibleDatePackagesByName(activeCategory.name)
      : false;
  };

  // Check if active category is a tour (uses booking slots)
  const isTourPackage = (): boolean => {
    if (!activeCategoryId) return false;
    const activeCategory =
      catsWithPkgs.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      ) ?? allCats.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      );
    return activeCategory ? usesBookingSlotsByName(activeCategory.name) : false;
  };

  // Get disabled dates for DayPicker (for non-flexible packages)
  const getDisabledDates = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Disable past dates
    if (checkDate < today) return true;

    return false;
  };

  // Get available dates from selected package
  const getAvailableDates = (): string[] => {
    if (!selectedPackage?.travel_dates) return [];
    if (Array.isArray(selectedPackage.travel_dates)) {
      return selectedPackage.travel_dates.map((d: any) =>
        typeof d === 'string' ? d : d.value
      );
    }
    return [];
  };

  const updatePersonCount = (type: keyof PersonsCount, delta: number) => {
    setPersons(prev => {
      const newValue = prev[type] + delta;

      // For adults, enforce minimum of 2
      if (type === 'adult') {
        const minAdults = 2;
        if (newValue < minAdults) {
          return prev; // Don't allow going below minimum
        }
        return { ...prev, [type]: newValue };
      }

      // For children and infants, prevent negative values
      if (newValue < 0) {
        return prev;
      }

      return { ...prev, [type]: newValue };
    });
  };

  const getTotalPersons = () => {
    return persons.adult + persons.child + persons.infant;
  };

  const getPersonsDisplayText = () => {
    const total = getTotalPersons();
    if (total === 0) return 'Persons';
    return `${total} ${total === 1 ? 'Person' : 'Persons'}`;
  };

  const handleSearch = () => {
    if (!selectedPackage) {
      return;
    }

    // Get category slug from active category
    const activeCategory =
      catsWithPkgs.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      ) ?? allCats.find(
        cat =>
          (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
      );

    if (activeCategory) {
      // Convert category name to slug
      const categorySlug = String(activeCategory.name ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Generate short slug for URL (under 70 chars total)
      const packageSlug = generateShortSlug(
        selectedPackage.package_name,
        selectedPackage.package_id,
        selectedPackage.package_days,
        selectedPackage.package_nights
      );

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (selectedDate) {
        queryParams.set('date', format(selectedDate, 'yyyy-MM-dd'));
      } else if (selectedDateString) {
        queryParams.set('date', selectedDateString);
      }
      if (persons.adult > 0) {
        queryParams.set('adults', persons.adult.toString());
      }
      if (persons.child > 0) {
        queryParams.set('children', persons.child.toString());
      }
      if (persons.infant > 0) {
        queryParams.set('infants', persons.infant.toString());
      }

      const queryString = queryParams.toString();
      const url = `/category/${categorySlug}/${packageSlug}${
        queryString ? `?${queryString}` : ''
      }`;

      // Navigate to package details page
      router.push(url);
    } else {
    }
  };

  const scrollToForm = () => {
    document
      .querySelector('.banner_form_card')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className='w-full'>
      <section className='banner_section'>
        <div className='banner_container'>
          <div className='banner_left'>
            <h1 className='banner_heading'>
              Travel Beyond Expectations with Aapka Tourism
            </h1>
            <div className='banner_subtitle_wrap'>
              <span className='banner_subtitle_line' />
              <span className='banner_subtitle'>SINCE 2024</span>
              <span className='banner_subtitle_line' />
            </div>
            <p className='banner_description'>
              Discover bespoke travel experiences that blend authenticity with
              elegance, where every moment is thoughtfully composed and every
              destination tells a deeper story.
            </p>
            <button
              type='button'
              className='banner_cta_btn banner_cta_slider_style'
              onClick={scrollToForm}
            >
              See all packages
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='banner_cta_arrow'
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.7505 11.25H3.2507V12.75H20.7505V11.25Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z'
                  fill='currentColor'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z'
                  fill='currentColor'
                />
              </svg>
            </button>
          </div>

          <div className='banner_form_card search_form_container'>
            <h3 className='banner_form_header'>
              <span className='banner_form_star'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 256 256'
                  width={16}
                  focusable='false'
                  color='var(--token-dfac4a67-4238-4aab-bc86-20fbdeb40318, rgb(65, 206, 142))'
                >
                  <g color='var(--token-dfac4a67-4238-4aab-bc86-20fbdeb40318, rgb(65, 206, 142))'>
                    <path
                      d='M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z'
                      opacity='0.2'
                    ></path>
                    <path d='M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z'></path>
                  </g>
                </svg>
              </span>{' '}
              PLAN YOUR ESCAPE
            </h3>
            <div className='search_tabs'>
              {catsWithPkgs.map((category) => {
                // Try different possible field names for category ID
                const categoryId =
                  category.category_id ||
                  (category as any).id ||
                  (category as any).categoryId;
                const isFlexibleDatePackages =
                  category.name === 'Flexible Date Packages';
                return (
                  <button
                    key={categoryId || category.name}
                    className={`search_tab ${activeCategoryId === categoryId ? 'active' : ''} ${
                      isFlexibleDatePackages ? 'search_tab_with_badge' : ''
                    }`}
                    onClick={() => {
                      handleCategoryClick(categoryId);
                    }}
                  >
                    {isFlexibleDatePackages && (
                      <span className='banner_tab_badge'>NEW</span>
                    )}
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className='search_form_fields'>
              {/* Package Dropdown */}
              <div
                className='banner_form_group banner_form_group_full'
                ref={packageDropdownRef}
              >
                <label className='banner_form_label'>Package</label>
                <div className='search_input_wrapper'>
                  <input
                    type='text'
                    placeholder='Where would you like to go?'
                    className='search_input'
                    value={selectedPackage?.package_name || ''}
                    readOnly
                    onClick={e => {
                      e.stopPropagation();
                      setShowPackageDropdown(!showPackageDropdown);
                    }}
                  />
                  <ChevronDown className='dropdown_chevron' />
                  {showPackageDropdown && (
                    <div className='custom_dropdown'>
                      {loadingPackages ? (
                        <div className='dropdown_item'>
                          <div className='dropdown_item_name'>
                            Loading packages...
                          </div>
                        </div>
                      ) : packages.length > 0 ? (
                        packages.map(pkg => {
                          return (
                            <div
                              key={pkg.package_id}
                              className='dropdown_item'
                              onClick={e => {
                                e.stopPropagation();
                                handlePackageSelect(pkg);
                              }}
                            >
                              <div className='dropdown_item_name'>
                                {pkg.package_name}
                              </div>
                              <div className='dropdown_item_price'>
                                AED{' '}
                                {pkg.package_price?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className='dropdown_item'>
                          <div className='dropdown_item_name'>
                            No packages available for this category
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Picker / Date Dropdown */}
              {getActiveCategoryType() === 1 ? (
                // Package type: Show dropdown with dates from package
                <div className='banner_form_group banner_form_group_half'>
                  <label className='banner_form_label'>Select dates</label>
                  <div className='search_input_wrapper' ref={dateDropdownRef}>
                    <input
                      type='text'
                      placeholder={
                        !selectedPackage
                          ? 'Select package first'
                          : getAvailableDates().length === 0
                            ? 'No dates available'
                            : 'Choose your date'
                      }
                      className='search_input'
                      value={
                        selectedDateString
                          ? (() => {
                              const d =
                                parseDateStringToLocal(selectedDateString);
                              return d ? format(d, 'MMM dd, yyyy') : '';
                            })()
                          : ''
                      }
                      readOnly
                      disabled={
                        !selectedPackage || getAvailableDates().length === 0
                      }
                      onClick={() => {
                        if (selectedPackage && getAvailableDates().length > 0) {
                          setShowDateDropdown(!showDateDropdown);
                        }
                      }}
                    />
                    <ChevronDown className='dropdown_chevron' />
                    {showDateDropdown && selectedPackage && (
                      <div className='custom_dropdown'>
                        {getAvailableDates().length > 0 ? (
                          getAvailableDates().map((dateStr, idx) => (
                            <div
                              key={idx}
                              className='dropdown_item'
                              onClick={e => {
                                e.stopPropagation();
                                handleDateStringSelect(dateStr);
                              }}
                            >
                              <div className='dropdown_item_name'>
                                {(() => {
                                  const d = parseDateStringToLocal(dateStr);
                                  return d
                                    ? format(d, 'MMM dd, yyyy')
                                    : dateStr;
                                })()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className='dropdown_item'>
                            <div className='dropdown_item_name'>
                              No dates available for this package
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Tour type or Flexible Date Packages: Show calendar
                <div className='banner_form_group banner_form_group_half'>
                  <label className='banner_form_label'>Select dates</label>
                  <div className='search_input_wrapper' ref={datePickerRef}>
                    <input
                      type='text'
                      placeholder='Choose your date'
                      className='search_input'
                      value={
                        selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''
                      }
                      readOnly
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    />
                    {showDatePicker && (
                      <div
                        className={`date_picker_dropdown ${isFlexibleDatePackage() ? 'date_picker_dropdown_small' : ''}`}
                      >
                        {isFlexibleDatePackage() && selectedPackage ? (
                          <FlexibleDateCalendar
                            packageId={selectedPackage.package_id || ''}
                            endDate={selectedPackage.end_date}
                            dateRanges={selectedPackage.date_ranges}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            month={month}
                            onMonthChange={setMonth}
                          />
                        ) : (
                          <>
                            <div className='calendar_header_nav'>
                              <button
                                className='calendar_nav_button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() - 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ‹
                              </button>
                              <button
                                className='calendar_nav_button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() + 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ›
                              </button>
                            </div>
                            <DayPicker
                              mode='single'
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={date => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const tomorrow = new Date(today);
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);

                                // Disable past dates
                                if (checkDate < today) return true;

                                // For tours only: disable today and tomorrow
                                if (isTourPackage()) {
                                  if (checkDate.getTime() === today.getTime())
                                    return true;
                                  if (
                                    checkDate.getTime() === tomorrow.getTime()
                                  )
                                    return true;
                                }

                                return false;
                              }}
                              numberOfMonths={1}
                              showOutsideDays={true}
                              month={month}
                              onMonthChange={setMonth}
                              className='custom_calendar'
                            />
                            <div className='calendar_footer'>
                              <button
                                className='clear_dates_button'
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDate(undefined);
                                }}
                              >
                                Clear dates
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Persons Dropdown */}
              <div className='banner_form_group banner_form_group_half'>
                <label className='banner_form_label'>Travelers</label>
                <div className='search_input_wrapper' ref={personsDropdownRef}>
                  <input
                    type='text'
                    placeholder='Number of visitors'
                    className='search_input'
                    value={getPersonsDisplayText()}
                    readOnly
                    onClick={() => setShowPersonsDropdown(!showPersonsDropdown)}
                  />
                  <ChevronDown className='dropdown_chevron' />
                  {showPersonsDropdown && (
                    <div className='persons_dropdown'>
                      <div className='person_counter_row'>
                        <span className='person_label'>Adult</span>
                        <div className='person_counter'>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('adult', -1)}
                            disabled={persons.adult <= 2}
                          >
                            <Minus className='counter_icon' />
                          </button>
                          <span className='counter_value'>{persons.adult}</span>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('adult', 1)}
                          >
                            <Plus className='counter_icon' />
                          </button>
                        </div>
                      </div>
                      <div className='person_counter_row'>
                        <span className='person_label'>Child</span>
                        <div className='person_counter'>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('child', -1)}
                            disabled={persons.child === 0}
                          >
                            <Minus className='counter_icon' />
                          </button>
                          <span className='counter_value'>{persons.child}</span>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('child', 1)}
                          >
                            <Plus className='counter_icon' />
                          </button>
                        </div>
                      </div>
                      <div className='person_counter_row'>
                        <span className='person_label'>Infant</span>
                        <div className='person_counter'>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('infant', -1)}
                            disabled={persons.infant === 0}
                          >
                            <Minus className='counter_icon' />
                          </button>
                          <span className='counter_value'>
                            {persons.infant}
                          </span>
                          <button
                            className='counter_button'
                            onClick={() => updatePersonCount('infant', 1)}
                          >
                            <Plus className='counter_icon' />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                className='search_button banner_submit_btn'
                onClick={handleSearch}
              >
                Submit
              </button>
            </div>
            <p className='banner_form_footer'>
              <span className='banner_form_stars' aria-hidden>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className='banner_form_star'
                    fill='currentColor'
                    strokeWidth={0}
                  />
                ))}
              </span>
              Trusted by 10,000+ travelers worldwide
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
