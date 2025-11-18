'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import './header.css';

interface Category {
  id: string;
  name: string;
}

export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPackagesDropdownOpen, setIsPackagesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePackagesOpen, setIsMobilePackagesOpen] = useState(false);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/package-categories?limit=100');
        const result = await response.json();
        if (result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const getCategorySlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  return (
    <>
      <header className='header'>
        <div className='header__container'>
          <Link href='/' className='header__logo'>
            <img src='/aapka-tourism-logo.png' alt='Logo' />
          </Link>

          {/* Desktop Navigation */}
          <div className='navbar desktop-nav'>
            <ul>
              <li>
                <Link href='/' className='header-nav-link'>
                  Home
                </Link>
              </li>
              <li className='header-dropdown-container'>
                <button
                  className='header-dropdown-button'
                  onClick={() =>
                    setIsPackagesDropdownOpen(!isPackagesDropdownOpen)
                  }
                >
                  Packages
                  <ChevronDown
                    size={16}
                    className={`header-chevron ${
                      isPackagesDropdownOpen ? 'open' : ''
                    }`}
                  />
                </button>
                {isPackagesDropdownOpen && (
                  <>
                    <div
                      className='header-dropdown-overlay'
                      onClick={() => setIsPackagesDropdownOpen(false)}
                    />
                    <div className='header-dropdown-menu'>
                      {categories.length > 0 ? (
                        categories.map(category => (
                          <Link
                            key={category.id}
                            href={`/category/${getCategorySlug(category.name)}`}
                            className='header-dropdown-item'
                            onClick={() => setIsPackagesDropdownOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))
                      ) : (
                        <div className='header-dropdown-item disabled'>
                          No categories available
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
              <li>
                <Link href='/About' className='header-nav-link'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='header-nav-link'>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href='/cart' className='header-cart-link'>
                  <ShoppingCart size={20} />
                  {cartItemCount > 0 && (
                    <span className='header-cart-badge'>{cartItemCount}</span>
                  )}
                </Link>
              </li>
              <li>
                <a href='tel:+971501234567' className='header-call-button'>
                  Call Us
                </a>
              </li>
            </ul>
          </div>

          {/* Mobile Cart Icon and Hamburger Button */}
          <div className='mobile-header-actions'>
            <Link href='/cart' className='mobile-header-cart-button'>
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className='mobile-header-cart-badge'>
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button
              className='mobile-menu-button'
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label='Open menu'
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      <div
        className={`mobile-sidebar-overlay ${
          isMobileMenuOpen ? 'mobile-sidebar-open' : ''
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`mobile-sidebar ${
            isMobileMenuOpen ? 'mobile-sidebar-open' : ''
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Sidebar Header */}
          <div className='mobile-sidebar-header'>
            <Link
              href='/'
              className='mobile-sidebar-logo'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img src='/aapka-tourism-logo.png' alt='Logo' />
            </Link>
            <button
              className='mobile-sidebar-close'
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label='Close menu'
            >
              <X size={24} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className='mobile-sidebar-nav'>
            <Link
              href='/'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            <div className='mobile-sidebar-dropdown'>
              <button
                className='mobile-sidebar-link mobile-sidebar-dropdown-button'
                onClick={() => setIsMobilePackagesOpen(!isMobilePackagesOpen)}
              >
                Packages
                <ChevronDown
                  size={18}
                  className={`mobile-sidebar-chevron ${
                    isMobilePackagesOpen ? 'open' : ''
                  }`}
                />
              </button>
              {isMobilePackagesOpen && (
                <div className='mobile-sidebar-dropdown-menu'>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <Link
                        key={category.id}
                        href={`/category/${getCategorySlug(category.name)}`}
                        className='mobile-sidebar-dropdown-item'
                        onClick={() => {
                          setIsMobilePackagesOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {category.name}
                      </Link>
                    ))
                  ) : (
                    <div className='mobile-sidebar-dropdown-item disabled'>
                      No categories available
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href='/About'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>

            <Link
              href='/contact'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>

            <Link
              href='/cart'
              className='mobile-sidebar-link mobile-sidebar-cart'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCart size={20} />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className='mobile-cart-badge'>{cartItemCount}</span>
              )}
            </Link>
          </nav>

          {/* Sidebar Action Buttons */}
          <div className='mobile-sidebar-actions'>
            <a
              href='tel:+971501234567'
              className='mobile-sidebar-button mobile-sidebar-button-secondary'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Call Us
            </a>
            <Link
              href='/cart'
              className='mobile-sidebar-button mobile-sidebar-button-primary'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
