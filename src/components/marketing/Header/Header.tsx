'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { gsap } from 'gsap';
import './header.css';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const pathname = usePathname();
  const navRef = useRef<HTMLUListElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

  // Animate underline on pathname change
  useEffect(() => {
    if (!underlineRef.current || !navRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Check again inside setTimeout as refs might have changed
      if (!underlineRef.current || !navRef.current) return;

      const activeLink = Object.keys(linkRefs.current).find(key => {
        if (key === pathname) return true;
        // Handle category pages that start with the path
        if (pathname.startsWith(key) && key !== '/') return true;
        return false;
      });

      if (!activeLink || !linkRefs.current[activeLink]) {
        // Hide underline if no active link
        if (underlineRef.current) {
          gsap.to(underlineRef.current, {
            opacity: 0,
            duration: 0.2,
          });
        }
        return;
      }

      const activeLinkElement = linkRefs.current[activeLink];
      if (!activeLinkElement || !navRef.current) return;

      const linkRect = activeLinkElement.getBoundingClientRect();
      const navRect = navRef.current.getBoundingClientRect();

      const left = linkRect.left - navRect.left;
      const width = linkRect.width;

      // Show and animate underline
      if (underlineRef.current) {
        gsap.to(underlineRef.current, {
          left: `${left}px`,
          width: `${width}px`,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <header className='header'>
        <div className='header__container'>
          <Link href='/' className='header__logo'>
            <img src='/aapka-tourism-logo.png' alt='Logo' />
          </Link>

          {/* Desktop Navigation */}
          <div className='navbar desktop-nav'>
            <ul ref={navRef}>
              <div ref={underlineRef} className='nav-underline' />
              <li
                ref={el => {
                  linkRefs.current['/'] = el;
                }}
                className={pathname === '/' ? 'active' : ''}
              >
                <Link
                  href='/'
                  className={`header-nav-link ${
                    pathname === '/' ? 'active' : ''
                  }`}
                >
                  Home
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/category/offer-packages'] = el;
                }}
                className={
                  pathname === '/category/offer-packages' ? 'active' : ''
                }
              >
                <Link
                  href='/category/offer-packages'
                  className={`header-nav-link ${
                    pathname === '/category/offer-packages' ? 'active' : ''
                  }`}
                >
                  Offer Packages
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/category/flexible-date-packages'] = el;
                }}
                className={`header-nav-link-with-badge ${
                  pathname === '/category/flexible-date-packages'
                    ? 'active'
                    : ''
                }`}
              >
                <span className='header-nav-badge'>NEW</span>
                <Link
                  href='/category/flexible-date-packages'
                  className={`header-nav-link ${
                    pathname === '/category/flexible-date-packages'
                      ? 'active'
                      : ''
                  }`}
                >
                  Flexible Date Packages
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/category/uae-tours'] = el;
                }}
                className={pathname === '/category/uae-tours' ? 'active' : ''}
              >
                <Link
                  href='/category/uae-tours'
                  className={`header-nav-link ${
                    pathname === '/category/uae-tours' ? 'active' : ''
                  }`}
                >
                  Tours
                </Link>
              </li>

              <li
                ref={el => {
                  linkRefs.current['/About'] = el;
                }}
                className={pathname === '/About' ? 'active' : ''}
              >
                <Link
                  href='/About'
                  className={`header-nav-link ${
                    pathname === '/About' ? 'active' : ''
                  }`}
                >
                  About
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/contact'] = el;
                }}
                className={pathname === '/contact' ? 'active' : ''}
              >
                <Link
                  href='/contact'
                  className={`header-nav-link ${
                    pathname === '/contact' ? 'active' : ''
                  }`}
                >
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
                <a href='tel:+971567809460' className='header-call-button'>
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
              className={`mobile-sidebar-link ${
                pathname === '/' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              href='/category/offer-packages'
              className={`mobile-sidebar-link ${
                pathname === '/category/offer-packages' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Offer Packages
            </Link>

            <Link
              href='/category/uae-tours'
              className={`mobile-sidebar-link ${
                pathname === '/category/uae-tours' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tours
            </Link>

            <Link
              href='/category/flexible-date-packages'
              className={`mobile-sidebar-link mobile-sidebar-link-with-badge ${
                pathname === '/category/flexible-date-packages' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className='mobile-sidebar-badge'>NEW</span>
              Flexible Date Packages
            </Link>

            <Link
              href='/About'
              className={`mobile-sidebar-link ${
                pathname === '/About' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>

            <Link
              href='/contact'
              className={`mobile-sidebar-link ${
                pathname === '/contact' ? 'active' : ''
              }`}
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
              href='tel:+971567809460'
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
