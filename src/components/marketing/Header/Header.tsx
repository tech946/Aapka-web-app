'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Plus, Settings, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { gsap } from 'gsap';
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
  const [isAgent, setIsAgent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [categoriesWithPackages, setCategoriesWithPackages] = useState<Category[]>([]);
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLUListElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
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

  // Fetch categories with packages
  useEffect(() => {
    const fetchCategoriesWithPackages = async () => {
      try {
        const response = await fetch('/api/package-categories?limit=100');
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          // Check package count for each category and filter out categories with zero packages
          const categoriesWithPackagesPromises = result.data.map(async (category: Category) => {
            const categoryId =
              category.category_id ||
              category.id ||
              category.categoryId;
            
            if (!categoryId) return null;
            
            try {
              const packagesResponse = await fetch(
                `/api/packages?category_id=${categoryId}&limit=1&status=active`
              );
              if (packagesResponse.ok) {
                const packagesResult = await packagesResponse.json();
                const packageCount = packagesResult.total || 0;
                return packageCount > 0 ? category : null;
              }
              return null;
            } catch (error) {
              return null;
            }
          });
          
          const categoriesWithPackagesResults = await Promise.all(categoriesWithPackagesPromises);
          const filteredCategories = categoriesWithPackagesResults.filter(
            (cat): cat is Category => cat !== null
          );
          
          setCategoriesWithPackages(filteredCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategoriesWithPackages();
  }, []);

  // Check agent status and login status
  useEffect(() => {
    const checkAgentStatus = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || '');
          
          // Get user name from metadata or email
          const name = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0] || 
                      'User';
          setUserName(name);
          
          // Check if user is an agent
          const response = await fetch('/api/agent-subscription/check-agent-status');
          const data = await response.json();
          setIsAgent(data.hasActiveSubscription || false);
        } else {
          setIsLoggedIn(false);
          setIsAgent(false);
          setUserName('');
          setUserEmail('');
        }
      } catch (error) {
        console.error('Error checking agent status:', error);
        setIsLoggedIn(false);
        setIsAgent(false);
        setUserName('');
        setUserEmail('');
      }
    };

    checkAgentStatus();
    
    // Listen for auth state changes
    const supabase = createClientComponentClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAgentStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setIsAgent(false);
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
              {categoriesWithPackages.map(category => {
                const href = getCategoryHref(category);
                const isFlexibleDatePackages = category.name === 'Flexible Date Packages';
                return (
                  <li
                    key={category.id || category.category_id || category.categoryId}
                    ref={el => {
                      linkRefs.current[href] = el;
                    }}
                    className={`${pathname === href || pathname.startsWith(href + '/') ? 'active' : ''} ${isFlexibleDatePackages ? 'header-nav-link-with-badge' : ''}`}
                  >
                    {isFlexibleDatePackages && (
                      <span className='header-nav-badge'>NEW</span>
                    )}
                    <Link
                      href={href}
                      className={`header-nav-link ${
                        pathname === href || pathname.startsWith(href + '/')
                          ? 'active'
                          : ''
                      }`}
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}

              <li
                ref={el => {
                  linkRefs.current['/blogs'] = el;
                }}
                className={pathname === '/blogs' || pathname?.startsWith('/blogs/') ? 'active' : ''}
              >
                <Link
                  href='/blogs'
                  className={`header-nav-link ${
                    pathname === '/blogs' || pathname?.startsWith('/blogs/') ? 'active' : ''
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
                              <div className='header-user-dropdown-name'>{userName}</div>
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
                              <LayoutDashboard size={16} className='header-user-dropdown-item-icon' />
                              <span>Dashboard</span>
                            </Link>
                          )}
                          <Link
                            href='/become-partner'
                            className='header-user-dropdown-item'
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <Plus size={16} className='header-user-dropdown-item-icon' />
                            <span>Become a Aapka Partner</span>
                          </Link>
                          <Link
                            href='#'
                            className='header-user-dropdown-item'
                            onClick={(e) => {
                              e.preventDefault();
                              setShowUserDropdown(false);
                            }}
                          >
                            <Settings size={16} className='header-user-dropdown-item-icon' />
                            <span>Settings</span>
                          </Link>
                          <button
                            className='header-user-dropdown-item header-user-dropdown-item-logout'
                            onClick={handleLogout}
                          >
                            <span>Sign Out</span>
                            <ChevronRight size={16} className='header-user-dropdown-chevron' />
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

            {categoriesWithPackages.map(category => {
              const href = getCategoryHref(category);
              const isFlexibleDatePackages = category.name === 'Flexible Date Packages';
              return (
                <Link
                  key={category.id || category.category_id || category.categoryId}
                  href={href}
                  className={`mobile-sidebar-link ${
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'active'
                      : ''
                  } ${isFlexibleDatePackages ? 'mobile-sidebar-link-with-badge' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isFlexibleDatePackages && (
                    <span className='mobile-sidebar-badge'>NEW</span>
                  )}
                  {category.name}
                </Link>
              );
            })}

            <Link
              href='/blogs'
              className={`mobile-sidebar-link ${
                pathname === '/blogs' || pathname?.startsWith('/blogs/') ? 'active' : ''
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
