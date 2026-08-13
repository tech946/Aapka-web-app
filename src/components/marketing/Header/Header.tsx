'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  useCategoriesWithPackages,
  useAgentStatus,
} from '@/hooks/use-marketing-queries';
import PartnerIcon from '@/components/icons/PartnerIcon';
import './header.css';

interface Category {
  id?: string;
  category_id?: string;
  categoryId?: string;
  name: string;
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPackagesDropdown, setShowPackagesDropdown] = useState(false);
  const [mobilePackagesExpanded, setMobilePackagesExpanded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const queryClient = useQueryClient();
  const { data: categoriesData = [] } = useCategoriesWithPackages(100);
  const categoriesWithPackages = categoriesData as unknown as Category[];
  const { data: agentData } = useAgentStatus(isLoggedIn);
  const isAgent = !!agentData?.hasActiveSubscription;
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLUListElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const packagesDropdownRef = useRef<HTMLDivElement>(null);
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

  // Expand mobile packages when on a category or marina page
  useEffect(() => {
    if (
      pathname.startsWith('/category') ||
      pathname.startsWith('/marina-cruise-dinner')
    ) {
      setMobilePackagesExpanded(true);
    }
  }, [pathname]);

  // Close all dropdowns on route change (prevents overlay from blocking clicks after navigation)
  useEffect(() => {
    setShowPackagesDropdown(false);
  }, [pathname]);

  // Sync session state (auth is fast; agent-status API is cached via useAgentStatus)
  useEffect(() => {
    const supabase = createClientComponentClient();
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        const email = session.user.email || '';
        setUserEmail(email);
        const fullName = (
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          ''
        ).trim();
        setUserName(fullName || email);
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setUserEmail('');
        queryClient.invalidateQueries({
          queryKey: ['marketing', 'agent-status'],
        });
      }
    };
    syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      // Agent status drives partner pricing everywhere, so it must not survive
      // a sign-in/sign-out on the 5-minute cache - otherwise an agent who just
      // logged in keeps seeing public prices.
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'USER_UPDATED'
      ) {
        queryClient.invalidateQueries({
          queryKey: ['marketing', 'agent-status'],
        });
      }
      syncSession();
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        packagesDropdownRef.current &&
        !packagesDropdownRef.current.contains(target)
      ) {
        setShowPackagesDropdown(false);
      }
    };

    if (showUserDropdown || showPackagesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown, showPackagesDropdown]);

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setShowUserDropdown(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const getCategoryHref = (category: Category) => {
    const slug = toSlug(category.name);
    return `/category/${slug}`;
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
                  linkRefs.current['/limited-time-deals'] = el;
                }}
                className={
                  pathname.startsWith('/limited-time-deals') ? 'active' : ''
                }
              >
                <Link
                  href='/limited-time-deals'
                  className={`header-nav-link header-nav-link-ltd ${
                    pathname.startsWith('/limited-time-deals') ? 'active' : ''
                  }`}
                >
                  <span className='header-ltd-zap-wrap' aria-hidden>
                    <Zap
                      size={16}
                      className='header-ltd-zap'
                      strokeWidth={2.5}
                    />
                  </span>
                  <span className='header-ltd-text'>Limited Time Deals</span>
                </Link>
              </li>
              {categoriesWithPackages.length > 0 && (
                <li
                  ref={el => {
                    linkRefs.current['/category'] = el;
                    categoriesWithPackages.forEach(cat => {
                      linkRefs.current[getCategoryHref(cat)] = el;
                    });
                  }}
                  className={`${
                    pathname.startsWith('/category') ? 'active' : ''
                  } header-dropdown-container`}
                  style={{ position: 'relative' }}
                >
                  <div
                    ref={packagesDropdownRef}
                    style={{ position: 'relative' }}
                  >
                    <button
                      type='button'
                      className='header-dropdown-button header-nav-link'
                      onClick={() =>
                        setShowPackagesDropdown(!showPackagesDropdown)
                      }
                      style={{
                        color:
                          pathname.startsWith('/category') ||
                          pathname.startsWith('/marina-cruise-dinner')
                            ? '#fd6b06'
                            : undefined,
                      }}
                    >
                      Tours & Packages
                      <ChevronDown
                        size={16}
                        className={`header-chevron ${showPackagesDropdown ? 'open' : ''}`}
                      />
                    </button>
                    {showPackagesDropdown && (
                      <>
                        <div
                          className='header-dropdown-overlay'
                          onClick={() => setShowPackagesDropdown(false)}
                          aria-hidden='true'
                        />
                        <div className='header-dropdown-menu header-dropdown-menu-packages'>
                          {categoriesWithPackages.map((category: Category) => {
                            const href = getCategoryHref(category);
                            const isFlexibleDatePackages =
                              category.name === 'Flexible Date Packages';
                            const key =
                              category.id ??
                              category.category_id ??
                              category.categoryId ??
                              category.name;
                            return (
                              <Fragment key={String(key)}>
                                <Link
                                  href={href}
                                  className={`header-dropdown-item ${isFlexibleDatePackages ? 'header-dropdown-item-with-badge' : ''}`}
                                  onClick={() => setShowPackagesDropdown(false)}
                                >
                                  {isFlexibleDatePackages && (
                                    <span className='header-dropdown-badge'>
                                      NEW
                                    </span>
                                  )}
                                  {category.name}
                                </Link>
                                {category.name === 'UAE Tours' && (
                                  <Link
                                    href='/marina-cruise-dinner'
                                    className='header-dropdown-item'
                                    onClick={() => setShowPackagesDropdown(false)}
                                  >
                                    Marina Cruise
                                  </Link>
                                )}
                              </Fragment>
                            );
                          })}
                          <Link
                            href='/customize-your-package'
                            className='header-dropdown-item'
                            onClick={() => setShowPackagesDropdown(false)}
                            style={{ display: 'none' }}
                          >
                            Customize Your Package
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )}

              {/* "Submit your enquiry" now lives in the floating right-edge tab
                  (EnquiryButton); B2B collaboration and the Oman links moved to
                  the footer. */}

              {/* Agents already signed in don't need the sign-up link */}
              {!isAgent && (
                <li
                  ref={el => {
                    linkRefs.current['/become-partner'] = el;
                  }}
                  className={
                    pathname.startsWith('/become-partner') ? 'active' : ''
                  }
                >
                  <Link
                    href='/become-partner'
                    className={`header-nav-link header-nav-link-partner ${
                      pathname.startsWith('/become-partner') ? 'active' : ''
                    }`}
                  >
                    <PartnerIcon size={22} className='header-partner-icon' />
                    <span>Become a Partner</span>
                  </Link>
                </li>
              )}

              {/* <li
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
              </li> */}
              <li>
                <Link href='/cart' className='header-cart-link'>
                  <ShoppingCart size={20} />
                  {cartItemCount > 0 && (
                    <span className='header-cart-badge'>{cartItemCount}</span>
                  )}
                </Link>
              </li>
              {/* <li>
                <a href='tel:+971567809460' className='header-call-button'>
                  Call Us
                </a>
              </li> */}
              <li>
                <div className='header-user-dropdown' ref={userDropdownRef}>
                  <button
                    className='header-user-button'
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    aria-label='User menu'
                  >
                    {isLoggedIn && (userName || userEmail) ? (
                      <div className='header-user-avatar-wrapper'>
                        <div className='header-user-avatar'>
                          {(userName || userEmail).charAt(0).toUpperCase()}
                        </div>
                        <span className='header-user-status-dot'></span>
                      </div>
                    ) : (
                      <div className='header-user-avatar-wrapper'>
                        <div className='header-user-avatar header-user-avatar-icon'>
                          <User size={20} />
                        </div>
                      </div>
                    )}
                  </button>
                  {showUserDropdown && (
                    <div className='header-user-dropdown-menu'>
                      {!isLoggedIn ? (
                        /* "Become a Partner" lives in the main nav now */
                        <Link
                          href='/agent/login'
                          className='header-user-dropdown-item'
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <span>Login</span>
                        </Link>
                      ) : (
                        <>
                          {/* User Info Header - Highlighted */}
                          <div className='header-user-dropdown-header-active'>
                            <div className='header-user-dropdown-icon-square'>
                              {(userName || userEmail).charAt(0).toUpperCase()}
                            </div>
                            <div className='header-user-dropdown-user-info'>
                              <div className='header-user-dropdown-name'>
                                {userName || userEmail}
                              </div>
                            </div>
                            <span className='header-user-dropdown-notification-dot'></span>
                          </div>

                          {/* Menu Items */}
                          {isAgent && (
                            <Link
                              href='/agent/dashboard'
                              className='header-user-dropdown-item'
                              onClick={() => setShowUserDropdown(false)}
                            >
                              <LayoutDashboard
                                size={16}
                                className='header-user-dropdown-item-icon'
                              />
                              <span>Dashboard</span>
                            </Link>
                          )}
                          {/* "Become a Partner" lives in the main nav now */}
                          <Link
                            href='#'
                            className='header-user-dropdown-item'
                            onClick={e => {
                              e.preventDefault();
                              setShowUserDropdown(false);
                            }}
                          >
                            <Settings
                              size={16}
                              className='header-user-dropdown-item-icon'
                            />
                            <span>Settings</span>
                          </Link>
                          <button
                            className='header-user-dropdown-item header-user-dropdown-item-logout'
                            onClick={handleLogout}
                          >
                            <span>Sign Out</span>
                            <ChevronRight
                              size={16}
                              className='header-user-dropdown-chevron'
                            />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
              href='/limited-time-deals'
              className={`mobile-sidebar-link mobile-sidebar-link-ltd ${
                pathname.startsWith('/limited-time-deals') ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Zap
                size={18}
                className='mobile-ltd-zap'
                aria-hidden
                strokeWidth={2.5}
              />
              <span className='mobile-ltd-label'>Limited Time Deals</span>
            </Link>

            {categoriesWithPackages.length > 0 && (
              <div className='mobile-sidebar-dropdown'>
                <button
                  type='button'
                  className={`mobile-sidebar-link mobile-sidebar-dropdown-button ${
                    pathname.startsWith('/category') ||
                    pathname.startsWith('/marina-cruise-dinner')
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setMobilePackagesExpanded(e => !e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tours & Packages
                  <ChevronDown
                    size={18}
                    className={`mobile-sidebar-chevron ${mobilePackagesExpanded ? 'open' : ''}`}
                    style={{ marginLeft: 'auto' }}
                  />
                </button>
                {mobilePackagesExpanded && (
                  <div className='mobile-sidebar-dropdown-menu'>
                    {categoriesWithPackages.map((category: Category) => {
                      const href = getCategoryHref(category);
                      const isFlexibleDatePackages =
                        category.name === 'Flexible Date Packages';
                      const key =
                        category.id ??
                        category.category_id ??
                        category.categoryId ??
                        category.name;
                      return (
                        <Fragment key={String(key)}>
                          <Link
                            href={href}
                            className={`mobile-sidebar-dropdown-item ${isFlexibleDatePackages ? 'mobile-sidebar-link-with-badge' : ''}`}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setMobilePackagesExpanded(false);
                            }}
                          >
                            {isFlexibleDatePackages && (
                              <span className='mobile-sidebar-badge'>NEW</span>
                            )}
                            {category.name}
                          </Link>
                          {category.name === 'UAE Tours' && (
                            <Link
                              href='/marina-cruise-dinner'
                              className='mobile-sidebar-dropdown-item'
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setMobilePackagesExpanded(false);
                              }}
                            >
                              Marina Cruise
                            </Link>
                          )}
                        </Fragment>
                      );
                    })}
                    <Link
                      href='/customize-your-package'
                      className='mobile-sidebar-dropdown-item'
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setMobilePackagesExpanded(false);
                      }}
                      style={{ display: 'none' }}
                    >
                      Customize Your Package
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* "Submit your enquiry" now lives in the floating right-edge tab
                (EnquiryButton); B2B collaboration and the Oman links moved to
                the footer. */}

            {!isAgent && (
              <Link
                href='/become-partner'
                className={`mobile-sidebar-link mobile-sidebar-link-partner ${
                  pathname.startsWith('/become-partner') ? 'active' : ''
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <PartnerIcon size={20} />
                <span>Become a Partner</span>
              </Link>
            )}

            {/* <Link
              href='/contact'
              className={`mobile-sidebar-link ${
                pathname === '/contact' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link> */}

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

          <div className='mobile-sidebar-footer-icons'>
            <Link
              href='/auth/login'
              className='mobile-sidebar-footer-icon-btn mobile-sidebar-footer-icon-left'
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label='Settings'
            >
              <Settings size={16} strokeWidth={2} />
            </Link>
            <Link
              href={
                isLoggedIn
                  ? isAgent
                    ? '/agent/dashboard'
                    : '/auth/login'
                  : '/auth/login'
              }
              className='mobile-sidebar-footer-icon-btn mobile-sidebar-footer-user'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={16} strokeWidth={2} aria-hidden />
              <span className='mobile-sidebar-footer-user-text'>
                {isLoggedIn ? userName || userEmail : 'Login'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
