'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal } from '@/lib/utils';
import './cart.css';

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateCartItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
    validateCart,
    isValidating,
  } = useCart();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Detect user location and initialize exchange rate on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize exchange rate first (fetch from database)
        await initializeExchangeRate();
        // Detect location
        const location = await detectUserLocation();
        console.log('Cart page - Detected location:', location);
        setUserLocation(location);
      } catch (error) {
        console.error('Error initializing:', error);
        // Default to non-India
        const defaultLocation = {
          country: 'Unknown',
          countryCode: 'US',
          isIndia: false,
          currency: 'AED',
          currencySymbol: 'AED',
        };
        console.log('Cart page - Using default location:', defaultLocation);
        setUserLocation(defaultLocation);
      }
    };

    initialize();
  }, []);

  // Validate cart on mount and when items change
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart();
    }
  }, [cartItems.length, validateCart]);

  // Helper function to format price - always shows AED
  const formatPrice = (price: number): string => {
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleQuantityChange = (
    item: any,
    type: 'adults' | 'children' | 'infants',
    delta: number
  ) => {
    if (item.isSoloTraveller) return;
    const currentValue = item[type] || 0;
    let newValue = currentValue + delta;
    const isOfferPackage = item.categorySlug === 'offer-packages';
    const isFlexibleDatePackage = item.categorySlug === 'flexible-date-packages';

    // Prevent adults from going below minimum
    if (type === 'adults') {
      if (isOfferPackage || isFlexibleDatePackage) {
        // Offer packages and flexible date packages require minimum 2 adults
        if (newValue < 2) {
          newValue = 2;
        }
      } else {
        // Regular packages require minimum 1 adult
        if (newValue < 1) {
          newValue = 1;
        }
      }
    } else {
      // Children and infants can't go below 0
      if (newValue < 0) {
        newValue = 0;
      }
    }

    const updates: any = { [type]: newValue };

    // Update cart item (price will be recalculated server-side)
    updateCartItem(item.packageId, item.selectedDate, updates);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not selected';
    const date = parseDateStringToLocal(dateString);
    if (date) {
      return format(date, 'MMM dd, yyyy');
    }
    return dateString;
  };

  if (cartItems.length === 0) {
    return (
      <div className='cart-page'>
        <div className='cart-container'>
          <div className='cart-header'>
            <h1>Cart</h1>
          </div>
          <div className='cart-empty'>
            <ShoppingCart size={80} className='cart-empty-icon' />
            <h2>Your cart is empty</h2>
            <p>Add some packages to get started!</p>
            <Link href='/' className='cart-empty-button'>
              Browse Packages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='cart-page'>
      <div className='cart-container'>
        <div className='cart-header'>
          <Link href='/' className='cart-back-button'>
            <ArrowLeft size={20} />
            Back to Packages
          </Link>
          <h1>Cart ({getTotalItems()} items)</h1>
          {cartItems.length > 0 && (
            <button onClick={clearCart} className='cart-clear-button'>
              Clear Cart
            </button>
          )}
        </div>

        <div className='cart-content'>
          <div className='cart-items'>
            {cartItems.map((item, index) => (
              <div
                key={`${item.packageId}-${item.selectedDate}-${index}-aed`}
                className='cart-item'
              >
                <div className='cart-item-image'>
                  {item.thumbnailImage ? (
                    <img
                      src={item.thumbnailImage}
                      alt={item.packageName}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className='cart-item-placeholder'>
                      <ShoppingCart size={40} />
                    </div>
                  )}
                </div>

                <div className='cart-item-details'>
                  <Link
                    href={`/category/${item.categorySlug}/${item.packageSlug}`}
                    className='cart-item-title'
                  >
                    {item.packageName}
                  </Link>
                  <div className='cart-item-meta'>
                    <span className='cart-item-date'>
                      Date: {formatDate(item.selectedDate)}
                    </span>
                    {item.nights && (
                      <span className='cart-item-nights'>
                        {item.nights} {item.nights === 1 ? 'night' : 'nights'}
                      </span>
                    )}
                  </div>

                  {item.isSoloTraveller ? (
                    <div className='cart-item-persons solo'>
                      <div className='cart-solo-label'>
                        Solo Traveller – {item.soloTravellerGender || 'N/A'}
                        {item.soloTravellerShareConsent
                          ? ' (sharing consented)'
                          : ''}
                      </div>
                    </div>
                  ) : (
                    <div className='cart-item-persons'>
                      <div className='cart-person-control'>
                        <label>Adults:</label>
                        <div className='cart-quantity-control'>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'adults', -1)
                            }
                            disabled={
                              item.categorySlug === 'offer-packages' || item.categorySlug === 'flexible-date-packages'
                                ? item.adults <= 2
                                : item.adults <= 1
                            }
                            className='cart-quantity-button'
                          >
                            <Minus size={16} />
                          </button>
                          <span className='cart-quantity-value'>
                            {item.adults}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'adults', 1)
                            }
                            className='cart-quantity-button'
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className='cart-person-control'>
                        <label>Children:</label>
                        <div className='cart-quantity-control'>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'children', -1)
                            }
                            disabled={item.children === 0}
                            className='cart-quantity-button'
                          >
                            <Minus size={16} />
                          </button>
                          <span className='cart-quantity-value'>
                            {item.children}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'children', 1)
                            }
                            className='cart-quantity-button'
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className='cart-person-control'>
                        <label>Infants:</label>
                        <div className='cart-quantity-control'>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'infants', -1)
                            }
                            disabled={(item.infants || 0) === 0}
                            className='cart-quantity-button'
                          >
                            <Minus size={16} />
                          </button>
                          <span className='cart-quantity-value'>
                            {item.infants || 0}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, 'infants', 1)
                            }
                            className='cart-quantity-button'
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visa Information */}
                  {item.withVisa && (item.visaForAdults > 0 || item.visaForChildren > 0 || item.visaForInfants > 0) && (
                    <div className='cart-item-persons' style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e40af', marginBottom: '4px' }}>
                        Visa Included:
                      </div>
                      {item.visaForAdults > 0 && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.visaForAdults} Adult{item.visaForAdults > 1 ? 's' : ''}
                        </div>
                      )}
                      {item.visaForChildren > 0 && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.visaForChildren} Child{item.visaForChildren > 1 ? 'ren' : ''}
                        </div>
                      )}
                      {item.visaForInfants > 0 && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.visaForInfants} Infant{item.visaForInfants > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className='cart-item-price-section'>
                  <div className='cart-item-price'>
                    {item.validated ? (
                      <>
                        {item.isDiscountActive && item.originalPrice && item.originalPrice > item.price && (
                          <span className='cart-item-original-price'>
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                        <span className={item.isDiscountActive ? 'cart-item-discounted-price' : ''}>
                          {formatPrice(item.price)}
                        </span>
                        {item.isDiscountActive && (
                          <span className='cart-item-discount-badge'>OFFER</span>
                        )}
                      </>
                    ) : (
                      <div className='cart-price-loading'>
                        <Loader2 size={16} className='spinning' />
                        <span>Calculating...</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      removeFromCart(item.packageId, item.selectedDate)
                    }
                    className='cart-item-remove'
                    title='Remove item'
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className='cart-summary'>
            <div className='cart-summary-content'>
              <h2>Order Summary</h2>
              <div className='cart-summary-row'>
                <span>Subtotal ({getTotalItems()} items):</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className='cart-summary-divider'></div>
              <div className='cart-summary-row cart-summary-total'>
                <span>Total:</span>
                <span>
                  {isValidating ? (
                    <div className='cart-price-loading'>
                      <Loader2 size={16} className='spinning' />
                      <span>Calculating...</span>
                    </div>
                  ) : (
                    <>{formatPrice(getTotalPrice())}</>
                  )}
                </span>
              </div>
              <Link
                href='/checkout'
                className='cart-checkout-button'
                style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  pointerEvents:
                    isValidating || getTotalPrice() === 0 ? 'none' : 'auto',
                  opacity: isValidating || getTotalPrice() === 0 ? 0.6 : 1,
                }}
              >
                {isValidating ? 'Validating...' : 'Proceed to Checkout'}
              </Link>
              <Link href='/' className='cart-continue-shopping'>
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
