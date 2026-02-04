'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useIsMobile } from '@/hooks/use-mobile';
import './package-details.css';

interface PackageDetailsTabsProps {
  pkg: {
    overview?: string | null;
    package_description?: string | null;
    holiday_description_html?: string | null;
    itinerary?: Array<{ heading?: string; desc?: string }> | null;
    inclusion_html?: string | null;
    exclusion_html?: string | null;
    terms_html?: string | null;
  };
}

export default function PackageDetailsTabs({ pkg }: PackageDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [expandedItineraryItems, setExpandedItineraryItems] = useState<Set<number>>(new Set());
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  });

  // Helper function to check if content exists and is not empty
  const hasContent = (content: string | null | undefined): boolean => {
    return content !== null && content !== undefined && content.trim().length > 0;
  };

  // Helper function to check if HTML content exists and is not empty
  const hasHtmlContent = (html: string | null | undefined): boolean => {
    if (!html) return false;
    // Remove HTML tags and check if there's actual text content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  };

  // Helper function to check if itinerary has valid content
  const hasItineraryContent = (itinerary: Array<{ heading?: string; desc?: string }> | null | undefined): boolean => {
    if (!itinerary || itinerary.length === 0) return false;
    // Check if at least one item has heading or desc
    return itinerary.some(item => hasContent(item.heading) || hasContent(item.desc));
  };

  // Get tabs based on available content
  const getTabs = () => {
    const tabs: Array<{ id: string; label: string }> = [];
    if (hasContent(pkg?.overview)) tabs.push({ id: 'overview', label: 'Overview' });
    if (hasContent(pkg?.package_description))
      tabs.push({ id: 'description', label: 'Description' });
    if (hasHtmlContent(pkg?.holiday_description_html))
      tabs.push({ id: 'holiday', label: 'Holiday Description' });
    if (hasItineraryContent(pkg?.itinerary))
      tabs.push({ id: 'itinerary', label: 'Itinerary' });
    if (hasHtmlContent(pkg?.inclusion_html))
      tabs.push({ id: 'inclusions', label: 'Inclusions' });
    if (hasHtmlContent(pkg?.exclusion_html))
      tabs.push({ id: 'exclusions', label: 'Exclusions' });
    if (hasHtmlContent(pkg?.terms_html))
      tabs.push({ id: 'terms', label: 'Terms & Conditions' });
    return tabs;
  };

  const tabs = getTabs();

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [pkg, tabs, activeTab]);

  const toggleItineraryItem = (index: number) => {
    setExpandedItineraryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Embla carousel navigation
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi || !isMobile) return;

    const updateScrollButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateScrollButtons();
    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);
    emblaApi.on('settle', updateScrollButtons);

    const handleResize = () => {
      emblaApi.reInit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      emblaApi.off('select', updateScrollButtons);
      emblaApi.off('reInit', updateScrollButtons);
      emblaApi.off('settle', updateScrollButtons);
      window.removeEventListener('resize', handleResize);
    };
  }, [emblaApi, isMobile]);

  return (
    <div className='package-details-container'>
      {/* Vertical Tabs Panel - Left */}
      {isMobile ? (
        <div className='package-details-tabs-panel-mobile'>
          <button
            className='tabs-slider-nav-button tabs-slider-prev'
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label='Previous tabs'
          >
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.24951 11.25H20.7493V12.75H3.24951V11.25Z" fill="black"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.9996 12.75C7.5272 12.75 10.4097 9.64786 10.4097 6.33995V5.58995H8.9097V6.33995C8.9097 8.85153 6.667 11.25 3.9996 11.25H3.24951V12.75H3.9996Z" fill="black"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.9996 11.25C7.5272 11.25 10.4097 14.3521 10.4097 17.66V18.41H8.9097V17.66C8.9097 15.1485 6.667 12.75 3.9996 12.75H3.24951V11.25H3.9996Z" fill="black"></path></svg>
          </button>
          <div className='tabs-slider-container' ref={emblaRef}>
            <div className='tabs-slider-wrapper'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`package-tab-button ${
                    activeTab === tab.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
            <button
              className='tabs-slider-nav-button tabs-slider-next'
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label='Next tabs'
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M20.7505 11.25H3.2507V12.75H20.7505V11.25Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z" fill="currentColor"/>
              </svg>
            </button>
        </div>
      ) : (
        <div className='package-details-tabs-panel'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`package-tab-button ${
                activeTab === tab.id ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='package-tab-chevron'>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.7505 11.25H3.2507V12.75H20.7505V11.25Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z" fill="currentColor"/>
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Content Panel - Right */}
      <div className='package-details-content-panel'>
        {activeTab === 'overview' && pkg.overview && (
          <div className='package-section'>
            <h2>Overview</h2>
            <p>{pkg.overview}</p>
          </div>
        )}

        {activeTab === 'description' && pkg.package_description && (
          <div className='package-section'>
            <h2>Description</h2>
            <p>{pkg.package_description}</p>
          </div>
        )}

        {activeTab === 'holiday' && pkg.holiday_description_html && (
          <div className='package-section'>
            <h2>Holiday Description</h2>
            <div
              className='package-html-content'
              dangerouslySetInnerHTML={{
                __html: pkg.holiday_description_html,
              }}
            />
          </div>
        )}

        {activeTab === 'itinerary' &&
          pkg.itinerary &&
          pkg.itinerary.length > 0 && (
            <div className='package-section'>
              <h2>Itinerary</h2>
              <div className='itinerary-list'>
                {pkg.itinerary.map((item, idx) => {
                  const isExpanded = expandedItineraryItems.has(idx);
                  return (
                    <div key={idx} className='itinerary-item'>
                      {item.heading && (
                        <button
                          className='itinerary-item-header'
                          onClick={() => toggleItineraryItem(idx)}
                        >
                          <h3
                            className='itinerary-heading'
                            dangerouslySetInnerHTML={{ __html: item.heading }}
                          />
                          <ChevronDown
                            className={`itinerary-chevron ${
                              isExpanded ? 'expanded' : ''
                            }`}
                          />
                        </button>
                      )}
                      {item.desc && (
                        <div
                          className={`itinerary-description ${
                            isExpanded ? 'expanded' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: item.desc }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {activeTab === 'inclusions' && pkg.inclusion_html && (
          <div className='package-section'>
            <h2>Inclusions</h2>
            <div
              className='package-html-content'
              dangerouslySetInnerHTML={{ __html: pkg.inclusion_html }}
            />
          </div>
        )}

        {activeTab === 'exclusions' && pkg.exclusion_html && (
          <div className='package-section'>
            <h2>Exclusions</h2>
            <div
              className='package-html-content'
              dangerouslySetInnerHTML={{ __html: pkg.exclusion_html }}
            />
          </div>
        )}

        {activeTab === 'terms' && pkg.terms_html && (
          <div className='package-section'>
            <h2>Terms & Conditions</h2>
            <div
              className='package-html-content'
              dangerouslySetInnerHTML={{ __html: pkg.terms_html }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
