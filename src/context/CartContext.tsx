'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

// Minimal cart item stored in localStorage (no prices)
export interface CartItemStorage {
  packageId: string;
  packageSlug: string;
  categorySlug: string;
  adults: number;
  children: number;
  infants: number;
  selectedDate: string | null;
  // Solo traveller support
  isSoloTraveller?: boolean;
  soloTravellerGender?: 'male' | 'female' | null;
  soloTravellerShareConsent?: boolean;
}

// Full cart item with validated prices from server
export interface CartItem extends CartItemStorage {
  packageName: string;
  thumbnailImage: string | null;
  price: number;
  originalPrice?: number | null; // Original price before discount
  adultPrice: number | null;
  childPrice: number | null;
  infantPrice: number | null;
  basePrice: number | null;
  isPackageType: boolean;
  nights?: number | null;
  days?: number | null;
  validated?: boolean; // Flag to indicate if price is validated
  // Discount info
  isDiscountActive?: boolean;
  adultDiscountAmount?: number | null;
  childDiscountAmount?: number | null;
  infantDiscountAmount?: number | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItemStorage) => void;
  removeFromCart: (packageId: string, selectedDate: string | null) => void;
  updateCartItem: (
    packageId: string,
    selectedDate: string | null,
    updates: Partial<CartItemStorage>
  ) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  validateCart: () => Promise<boolean>;
  isValidating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aapka_tourism_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Validate cart items and fetch prices from server
  const validateCart = useCallback(async (): Promise<boolean> => {
    setCartItems(currentItems => {
      if (currentItems.length === 0) {
        setIsValidating(false);
        return currentItems;
      }

      setIsValidating(true);
      // Validate asynchronously
      (async () => {
        try {
          const itemsToValidate = currentItems.map(item => ({
            packageId: item.packageId,
            adults: item.adults,
            children: item.children,
            infants: item.infants,
            selectedDate: item.selectedDate,
            isSoloTraveller: item.isSoloTraveller ?? false,
          }));

          const response = await fetch('/api/cart/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: itemsToValidate }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            // Remove invalid items
            if (result.invalidItems) {
              const invalidIds = result.invalidItems.map(
                (item: any) => item.packageId
              );
              setCartItems(prev =>
                prev.filter(item => !invalidIds.includes(item.packageId))
              );
            }
            setIsValidating(false);
            return;
          }

          // Update cart items with validated prices (including discounts)
          setCartItems(prev =>
            prev.map(item => {
              const validated = result.items.find(
                (v: any) => v.packageId === item.packageId && v.valid
              );
              if (validated) {
                return {
                  ...item,
                  packageName: validated.packageName,
                  price: validated.price,
                  originalPrice: validated.originalPrice,
                  adultPrice: validated.adultPrice,
                  childPrice: validated.childPrice,
                  infantPrice: validated.infantPrice,
                  basePrice: validated.basePrice,
                  nights: validated.nights,
                  days: validated.days,
                  thumbnailImage: validated.thumbnailImage,
                  validated: true,
                  // Discount info
                  isDiscountActive: validated.isDiscountActive,
                  adultDiscountAmount: validated.adultDiscountAmount,
                  childDiscountAmount: validated.childDiscountAmount,
                  infantDiscountAmount: validated.infantDiscountAmount,
                };
              }
              return item;
            })
          );

          setIsValidating(false);
        } catch (error) {
          setIsValidating(false);
        }
      })();

      return currentItems;
    });

    return true;
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: CartItemStorage[] = JSON.parse(stored);
        // Convert storage items to cart items (without prices initially)
        const items: CartItem[] = parsed.map(item => ({
          ...item,
          infants: item.infants || 0, // Handle legacy items without infants
          isSoloTraveller: item.isSoloTraveller ?? false,
          soloTravellerGender: item.soloTravellerGender ?? null,
          soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
          packageName: '',
          thumbnailImage: null,
          price: 0,
          adultPrice: null,
          childPrice: null,
          infantPrice: null,
          basePrice: null,
          isPackageType: false,
          validated: false,
        }));
        setCartItems(items);
        // Validate prices after loading
        if (items.length > 0) {
          validateCart();
        }
      }
    } catch (error) {
      // Error loading cart from localStorage
    } finally {
      setIsLoaded(true);
    }
  }, [validateCart]);

  // Save only minimal data to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        const storageItems: CartItemStorage[] = cartItems.map(item => ({
          packageId: item.packageId,
          packageSlug: item.packageSlug,
          categorySlug: item.categorySlug,
          adults: item.adults,
          children: item.children,
          infants: item.infants,
          selectedDate: item.selectedDate,
          isSoloTraveller: item.isSoloTraveller ?? false,
          soloTravellerGender: item.soloTravellerGender ?? null,
          soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
        }));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storageItems));
      } catch (error) {
        // Error saving cart to localStorage
      }
    }
  }, [cartItems, isLoaded]);

  const addToCart = (item: CartItemStorage) => {
    setCartItems(prev => {
      // Check if item already exists (same package + date combination)
      const existingIndex = prev.findIndex(
        cartItem =>
          cartItem.packageId === item.packageId &&
          cartItem.selectedDate === item.selectedDate
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          adults: item.adults,
          children: item.children,
          infants: item.infants,
          isSoloTraveller: item.isSoloTraveller ?? false,
          soloTravellerGender: item.soloTravellerGender ?? null,
          soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
          validated: false, // Mark as needing validation
        };
        // Validate after update
        setTimeout(() => validateCart(), 100);
        return updated;
      } else {
        // Add new item (without prices, will be validated)
        const newItem: CartItem = {
          ...item,
          infants: item.infants || 0, // Ensure infants is set
          isSoloTraveller: item.isSoloTraveller ?? false,
          soloTravellerGender: item.soloTravellerGender ?? null,
          soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
          packageName: '',
          thumbnailImage: null,
          price: 0,
          adultPrice: null,
          childPrice: null,
          infantPrice: null,
          basePrice: null,
          isPackageType: false,
          validated: false,
        };
        // Validate after adding
        setTimeout(() => validateCart(), 100);
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (packageId: string, selectedDate: string | null) => {
    setCartItems(prev =>
      prev.filter(
        item =>
          !(item.packageId === packageId && item.selectedDate === selectedDate)
      )
    );
  };

  const updateCartItem = (
    packageId: string,
    selectedDate: string | null,
    updates: Partial<CartItemStorage>
  ) => {
    setCartItems(prev =>
      prev.map(item => {
        if (
          item.packageId === packageId &&
          item.selectedDate === selectedDate
        ) {
          const updated = { ...item, ...updates, validated: false };
          // Validate after update to get correct prices
          setTimeout(() => validateCart(), 100);
          return updated;
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    // Only count validated prices
    return cartItems.reduce(
      (total, item) => total + (item.validated ? item.price : 0),
      0
    );
  };

  const getTotalItems = () => {
    return cartItems.length;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        getTotalPrice,
        getTotalItems,
        validateCart,
        isValidating,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
