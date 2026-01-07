'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { generateShortSlug, parseDateStringToLocal } from '@/lib/utils';
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

interface Package {
  package_id: string;
  package_name: string;
  package_price: number;
  package_days?: number | null;
  package_nights?: number | null;
  travel_dates?: Array<{ id: string; value: string }> | string[] | null;
}

interface PersonsCount {
  adult: number;
  child: number;
  infant: number;
}

export default function BannerSection() {
  const router = useRouter();
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [month, setMonth] = useState<Date>(new Date());
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [persons, setPersons] = useState<PersonsCount>({
    adult: 0,
    child: 0,
    infant: 0,
  });

  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPersonsDropdown, setShowPersonsDropdown] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const packageDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const personsDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch packages when category changes (initial load only)
  // Note: handleCategoryClick will fetch packages when user clicks tabs
  useEffect(() => {
    if (
      activeCategoryId &&
      activeCategoryId !== 'undefined' &&
      activeCategoryId !== 'null' &&
      categories.length > 0
    ) {
      // Only fetch on initial category set (when categories are first loaded)
      // Subsequent category changes are handled by handleCategoryClick
      const isInitialLoad = packages.length === 0;
      if (isInitialLoad) {
        fetchPackages(activeCategoryId);
      }
    } else if (
      !activeCategoryId ||
      activeCategoryId === 'undefined' ||
      activeCategoryId === 'null'
    ) {
      setPackages([]);
      setSelectedPackage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId, categories.length]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/package-categories?limit=100');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        // Log first category to see its structure
        if (result.data.length > 0) {
        }
        setCategories(result.data);
        if (result.data.length > 0) {
          // Try different possible field names
          const firstCategory = result.data[0];
          const categoryId =
            firstCategory.category_id ||
            firstCategory.id ||
            firstCategory.categoryId;
          if (categoryId) {
            setActiveCategoryId(categoryId);
          } else {
          }
        }
      }
    } catch (error) {}
  };

  const fetchPackages = async (categoryId: string) => {
    if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
      setPackages([]);
      setLoadingPackages(false);
      return;
    }

    try {
      setLoadingPackages(true);
      const response = await fetch(
        `/api/packages?category_id=${categoryId}&limit=100`
      );

      if (!response.ok) {
        setPackages([]);
        setLoadingPackages(false);
        return;
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setPackages(result.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleCategoryClick = (categoryId: string | null | undefined) => {
    if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
      return;
    }

    // Clear previous selection and packages
    setSelectedPackage(null);
    setPackages([]);
    setShowPackageDropdown(false);
    // Reset date selections
    setSelectedDate(undefined);
    setSelectedDateString('');
    setShowDatePicker(false);
    setShowDateDropdown(false);
    // Set active category (this will trigger useEffect, but we'll also fetch directly)
    setActiveCategoryId(categoryId);
    // Immediately fetch packages for the selected category
    fetchPackages(categoryId);
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPackageDropdown(false);
    // Reset date selection when package changes
    setSelectedDate(undefined);
    setSelectedDateString('');
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
    const activeCategory = categories.find(
      cat => (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
    );
    return activeCategory?.packagetypeid ?? null;
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
      const newValue = Math.max(0, prev[type] + delta);
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
    const activeCategory = categories.find(
      cat => (cat.category_id || cat.id || cat.categoryId) === activeCategoryId
    );

    if (activeCategory) {
      // Convert category name to slug
      const categorySlug = activeCategory.name
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

  return (
    <div className='w-full'>
      <section className='banner_section'>
        <div className='container'>
          <h1>Travel Beyond Expectations with Aapka Tourism</h1>
          <p>
            Plan unforgettable trips with curated experiences, seamless
            bookings, and trusted travel guidance.
          </p>

          <div className='search_form_container'>
            <div className='search_tabs'>
              {categories.map(category => {
                // Try different possible field names for category ID
                const categoryId =
                  category.category_id ||
                  (category as any).id ||
                  (category as any).categoryId;
                return (
                  <button
                    key={categoryId || category.name}
                    className={`search_tab ${activeCategoryId === categoryId ? 'active' : ''}`}
                    onClick={() => {
                      handleCategoryClick(categoryId);
                    }}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className='search_form_fields'>
              {/* Package Dropdown */}
              <div className='search_input_wrapper' ref={packageDropdownRef}>
                <MapPin className='search_input_icon' />
                <input
                  type='text'
                  placeholder='Select package...'
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
                              AED {pkg.package_price?.toLocaleString() || 'N/A'}
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

              {/* Date Picker / Date Dropdown */}
              {getActiveCategoryType() === 1 ? (
                // Package type: Show dropdown with dates from package
                <div className='search_input_wrapper' ref={dateDropdownRef}>
                  <Calendar className='search_input_icon' />
                  <input
                    type='text'
                    placeholder={
                      !selectedPackage
                        ? 'Select package first'
                        : getAvailableDates().length === 0
                          ? 'No dates available'
                          : 'Select date'
                    }
                    className='search_input'
                    value={
                      selectedDateString
                        ? (() => {
                            const d = parseDateStringToLocal(
                              selectedDateString
                            );
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
                                return d ? format(d, 'MMM dd, yyyy') : dateStr;
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
              ) : (
                // Tour type: Show calendar as is
                <div className='search_input_wrapper' ref={datePickerRef}>
                  <Calendar className='search_input_icon' />
                  <input
                    type='text'
                    placeholder='Add dates'
                    className='search_input'
                    value={
                      selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''
                    }
                    readOnly
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  />
                  {showDatePicker && (
                    <div className='date_picker_dropdown'>
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
                        disabled={{ before: new Date() }}
                        numberOfMonths={2}
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
                    </div>
                  )}
                </div>
              )}

              {/* Persons Dropdown */}
              <div className='search_input_wrapper' ref={personsDropdownRef}>
                <Users className='search_input_icon' />
                <input
                  type='text'
                  placeholder='Persons'
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
                          disabled={persons.adult === 0}
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
                        <span className='counter_value'>{persons.infant}</span>
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

              <button className='search_button' onClick={handleSearch}>
                <Search className='search_button_icon' />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
