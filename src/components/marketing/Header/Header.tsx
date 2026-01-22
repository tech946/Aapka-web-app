'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import './header.css';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

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
              <li>
                <Link
                  href='/category/offer-packages'
                  className='header-nav-link'
                >
                  Offer Packages
                </Link>
              </li>
              <li>
                <Link href='/category/uae-tours' className='header-nav-link'>
                  Tours
                </Link>
              </li>
              <li>
                <Link
                  href='/category/flexible-date-packages'
                  className='header-nav-link'
                >
                  Flexible Date Packages
                </Link>
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

            <Link
              href='/category/offer-packages'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Offer Packages
            </Link>

            <Link
              href='/category/uae-tours'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tours
            </Link>

            <Link
              href='/category/flexible-date-packages'
              className='mobile-sidebar-link'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Flexible Date Packages
            </Link>

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
