'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Plus,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  useCategoriesWithPackages,
  useAgentStatus,
} from '@/hooks/use-marketing-queries';
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
  const [showOmanDropdown, setShowOmanDropdown] = useState(false);
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
  const omanDropdownRef = useRef<HTMLDivElement>(null);
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

  // Expand mobile packages when on a category page
  useEffect(() => {
    if (pathname.startsWith('/category')) {
      setMobilePackagesExpanded(true);
    }
  }, [pathname]);

  // Close all dropdowns on route change (prevents overlay from blocking clicks after navigation)
  useEffect(() => {
    setShowPackagesDropdown(false);
    setShowOmanDropdown(false);
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
        setUserEmail(session.user.email || '');
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0] ||
          'User';
        setUserName(name);
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
    } = supabase.auth.onAuthStateChange(syncSession);
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
        omanDropdownRef.current &&
        !omanDropdownRef.current.contains(target)
      ) {
        setShowOmanDropdown(false);
      }
      if (
        packagesDropdownRef.current &&
        !packagesDropdownRef.current.contains(target)
      ) {
        setShowPackagesDropdown(false);
      }
    };

    if (showUserDropdown || showOmanDropdown || showPackagesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown, showOmanDropdown, showPackagesDropdown]);

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
                        color: pathname.startsWith('/category')
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
                              <Link
                                key={String(key)}
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
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )}

              <li
                ref={el => {
                  linkRefs.current['/blogs'] = el;
                }}
                className={
                  pathname === '/blogs' || pathname?.startsWith('/blogs/')
                    ? 'active'
                    : ''
                }
              >
                <Link
                  href='/blogs'
                  className={`header-nav-link ${
                    pathname === '/blogs' || pathname?.startsWith('/blogs/')
                      ? 'active'
                      : ''
                  }`}
                >
                  Blogs
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
                  linkRefs.current['/travel-enquiry'] = el;
                }}
                className={pathname === '/travel-enquiry' ? 'active' : ''}
              >
                <Link
                  href='/travel-enquiry'
                  className={`header-nav-link ${
                    pathname === '/travel-enquiry' ? 'active' : ''
                  }`}
                >
                  Submit your enquiry
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/customize-your-package'] = el;
                }}
                className={
                  pathname === '/customize-your-package' ? 'active' : ''
                }
              >
                <Link
                  href='/customize-your-package'
                  className={`header-nav-link ${
                    pathname === '/customize-your-package' ? 'active' : ''
                  }`}
                >
                  Customize Your Package
                </Link>
              </li>
              <li
                ref={el => {
                  linkRefs.current['/visas/apply-for-oman-visa'] = el;
                  linkRefs.current['/oman-transport'] = el;
                }}
                className={`${
                  pathname === '/visas/apply-for-oman-visa' ||
                  pathname === '/oman-transport'
                    ? 'active'
                    : ''
                } header-dropdown-container`}
                style={{ position: 'relative' }}
              >
                <div ref={omanDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type='button'
                    className='header-dropdown-button header-nav-link'
                    onClick={() => setShowOmanDropdown(!showOmanDropdown)}
                    style={{
                      color:
                        pathname === '/visas/apply-for-oman-visa' ||
                        pathname === '/oman-transport'
                          ? '#fd6b06'
                          : undefined,
                    }}
                  >
                    Oman
                    <ChevronDown
                      size={16}
                      className={`header-chevron ${showOmanDropdown ? 'open' : ''}`}
                    />
                  </button>
                  {showOmanDropdown && (
                    <>
                      <div
                        className='header-dropdown-overlay'
                        onClick={() => setShowOmanDropdown(false)}
                        aria-hidden='true'
                      />
                      <div className='header-dropdown-menu'>
                        <Link
                          href='/visas/apply-for-oman-visa'
                          className='header-dropdown-item'
                          onClick={() => setShowOmanDropdown(false)}
                        >
                          Apply for Oman Tourist Visa
                        </Link>
                        <Link
                          href='/oman-transport'
                          className='header-dropdown-item'
                          onClick={() => setShowOmanDropdown(false)}
                        >
                          Oman Exit Transportation
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </li>
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
                    {isLoggedIn && userName ? (
                      <div className='header-user-avatar-wrapper'>
                        <div className='header-user-avatar'>
                          {userName.charAt(0).toUpperCase()}
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
                        <>
                          <Link
                            href='/agent/login'
                            className='header-user-dropdown-item'
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>Login</span>
                          </Link>
                          <Link
                            href='/become-partner'
                            className='header-user-dropdown-item'
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span>Become a Aapka Partner</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          {/* User Info Header - Highlighted */}
                          <div className='header-user-dropdown-header-active'>
                            <div className='header-user-dropdown-icon-square'>
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className='header-user-dropdown-user-info'>
                              <div className='header-user-dropdown-name'>
                                {userName}
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
                          <Link
                            href='/become-partner'
                            className='header-user-dropdown-item'
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <Plus
                              size={16}
                              className='header-user-dropdown-item-icon'
                            />
                            <span>Become a Aapka Partner</span>
                          </Link>
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

            {categoriesWithPackages.length > 0 && (
              <div className='mobile-sidebar-dropdown'>
                <button
                  type='button'
                  className={`mobile-sidebar-link mobile-sidebar-dropdown-button ${
                    pathname.startsWith('/category') ? 'active' : ''
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
                        <Link
                          key={String(key)}
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Link
              href='/blogs'
              className={`mobile-sidebar-link ${
                pathname === '/blogs' || pathname?.startsWith('/blogs/')
                  ? 'active'
                  : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blogs
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
              href='/travel-enquiry'
              className={`mobile-sidebar-link ${
                pathname === '/travel-enquiry' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Submit your enquiry
            </Link>

            {/* Customize Your Package - commented out
            <Link
              href='/customize-your-package'
              className={`mobile-sidebar-link ${
                pathname === '/customize-your-package' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Customize Your Package
            </Link>
            */}

            <Link
              href='/visas/apply-for-oman-visa'
              className={`mobile-sidebar-link ${
                pathname === '/visas/apply-for-oman-visa' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Apply for Oman Tourist Visa
            </Link>
            <Link
              href='/oman-transport'
              className={`mobile-sidebar-link ${
                pathname === '/oman-transport' ? 'active' : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Oman Exit Transportation
            </Link>

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
        </div>
      </div>
    </>
  );
}
