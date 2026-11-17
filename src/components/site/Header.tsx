'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react';
import { useAgentStatus } from '@/hooks/use-marketing-queries';
import SocialIcon from './SocialIcon';
import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import { ANNOUNCEMENT, CONTACT, SOCIALS } from './site-config';
import { ALL_HOLIDAYS, useHolidayMenu } from './useHolidayMenu';
import { isPackageDetail } from './chrome-routes';
import TaSearch from './ta/TaSearch';
import './styles/theme.css';
import './styles/site.css';
import './ta/ta-chrome.css';

/* The account (profile) menu in the main bar and the profile / sign-out card
   at the top of the menu drawer are switched off for now. */
const SHOW_ACCOUNT_MENU = false;
/* The announcement bar above the header is hidden for now; flip to bring it back. */
const SHOW_ANNOUNCEMENT = false;

export default function Header() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const queryClient = useQueryClient();
  // homepage: the bar is one see-through row over the full-screen hero video
  // until the video has scrolled under it, then it turns solid and gets the
  // search + the holiday-type row
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const holidays = useHolidayMenu();
  const { data: agentData } = useAgentStatus(isLoggedIn);
  const isAgent = !!agentData?.hasActiveSubscription;

  useEffect(() => {
    // the hero is the screen's height, capped at 720px (ta-home.css .ta-hero)
    const onScroll = () => setPastHero(window.scrollY > Math.min(window.innerHeight, 720) - 96);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // a link in the drawer navigates; the drawer shouldn't follow you there
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Session state (same contract as the previous header): agent status drives
  // partner pricing everywhere, so it must not survive a sign-in/out.
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        const email = session.user.email || '';
        const fullName = (session.user.user_metadata?.full_name || session.user.user_metadata?.name || '').trim();
        setUserName(fullName || email);
      } else {
        setIsLoggedIn(false);
        setUserName('');
        queryClient.invalidateQueries({ queryKey: ['marketing', 'agent-status'] });
      }
    };
    syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ['marketing', 'agent-status'] });
      }
      syncSession();
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  async function handleLogout() {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const is = (p: string) => pathname === p || pathname.startsWith(p + '/');
  const holidaysActive = is('/holidays') || is('/category') || is('/marina-cruise-dinner') || is('/limited-time-deals');
  const initial = (userName || '?').charAt(0).toUpperCase();
  const isHome = pathname === '/';
  // the search + holiday-type row show everywhere except the top of the homepage
  const compact = !isHome || pastHero;
  // top of the homepage: floating over the hero video, white text
  const clear = isHome && !pastHero;
  // package detail pages have their own section tabs (PdpFloatNav), so no type row there
  const isPackagePage = isPackageDetail(pathname);
  // the listing has its own holiday-type filter, so no type row there either
  const showSub = compact && !isPackagePage && !is('/holidays');
  const subLinks = [
    ALL_HOLIDAYS,
    ...holidays,
    { key: 'oman-visa', href: '/visas/apply-for-oman-visa', label: 'Oman Visa', hint: '' },
    { key: 'oman-transport', href: '/oman-transport', label: 'Oman Transport', hint: '' },
  ];

  return (
    <div className="at-site desert-ember">
      {/* ── announcement bar: scrolls away with the page, never sticky ── */}
      {SHOW_ANNOUNCEMENT && (
      <div className="header_strip">
        <div className="container">
          <div className="strip_wrapper">
            <Link className="strip_offer" href={ANNOUNCEMENT.href}>
              <span className="strip_badge">{ANNOUNCEMENT.badge}</span>
              <span className="strip_text">{ANNOUNCEMENT.text}</span>
              <span className="strip_cta">
                {ANNOUNCEMENT.cta}
                <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </Link>
            <ul className="strip_social" aria-label="Follow Aapka Tourism">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* ── Tripadvisor-style bar: logo · search · pill nav · Contact (ta/ta-chrome.css) ── */}
      <header id="header" className={'ta-hdr' + (isHome ? ' is-home' : '') + (clear ? ' is-clear' : '') + (isPackagePage ? ' is-static' : '') + (showSub ? '' : ' no-sub')}>
        <nav className="ta-hdr__row" aria-label="Main">
          <Link className="ta-logo" href="/" aria-label="Aapka Tourism home">
            {clear ? (
              <img src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="Aapka Tourism" />
            ) : (
              <img src="/aapka-tourism-logo-footer.png" width="500" height="500" alt="Aapka Tourism" />
            )}
          </Link>
          {compact && (
            <div className="ta-hdr__search">
              <TaSearch variant="bar" />
            </div>
          )}

          <div className="ta-nav">
            <Link className="ta-pill ta-pill--glow" href={holidaysHref(LIMITED_DEALS.key)}>
              <Flame aria-hidden="true" />
              {LIMITED_DEALS.label}
            </Link>
            {holidays.length > 0 && (
              <div className="has-dropdown">
                <button type="button" className={'ta-pill' + (holidaysActive ? ' is-active' : '')} aria-haspopup="true">
                  Holidays
                  <ChevronDown aria-hidden="true" className="chev" />
                </button>
                <div className="sub-menu mega-menu ta-menu">
                  <ul className="ta-menu__list">
                    {[ALL_HOLIDAYS, ...holidays].map(({ key, href, label }) => (
                      <li key={key}>
                        <Link href={href} className="ta-menu__item">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {/* agents already signed in don't need the sign-up link */}
            {!isAgent && (
              <Link className="ta-pill" href="/become-partner" aria-current={is('/become-partner') ? 'page' : undefined}>
                Become a Partner
              </Link>
            )}
            <Link className="ta-pill" href="/blogs" aria-current={is('/blogs') ? 'page' : undefined}>
              Blogs
            </Link>
            {/* account menu hidden for now; flip SHOW_ACCOUNT_MENU to bring it back */}
            {SHOW_ACCOUNT_MENU && (
              <div className="has-dropdown">
                <button type="button" className="ta-pill ta-pill--icon" aria-label="Account" aria-haspopup="true">
                  {isLoggedIn ? <span className="nav-avatar">{initial}</span> : <UserRound aria-hidden="true" />}
                </button>
                <div className="profile_dropdown">
                  <p className="mega-menu__heading">{isLoggedIn ? userName : 'Account'}</p>
                  {isLoggedIn ? (
                    isAgent && (
                      <Link href="/agent/dashboard">
                        <LayoutDashboard size={15} strokeWidth={2} aria-hidden="true" />
                        Dashboard
                      </Link>
                    )
                  ) : (
                    <Link href="/agent/login">
                      <LogIn size={15} strokeWidth={2} aria-hidden="true" />
                      Agent login
                    </Link>
                  )}
                  <Link href="/travel-enquiry">
                    <ClipboardList size={15} strokeWidth={2} aria-hidden="true" />
                    Submit enquiry
                  </Link>
                  {isLoggedIn && (
                    <button type="button" onClick={handleLogout}>
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            )}
            <Link className="ta-pill ta-pill--dark" href="/contact" aria-current={is('/contact') ? 'page' : undefined}>
              Contact Us
            </Link>
            <button type="button" className="ta-pill ta-pill--icon ta-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu aria-hidden="true" />
            </button>
          </div>
        </nav>

        {showSub && (
          <nav className="ta-sub" aria-label="Holiday types">
            <ul>
              {subLinks.map(({ key, href, label }) => (
                <li key={key}>
                  <Link href={href} aria-current={!href.startsWith('/holidays') && href === pathname ? 'page' : undefined}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Mobile menu */}
      <div className={'mobile_menu' + (menuOpen ? ' open' : '')} id="mobileMenu" aria-hidden={!menuOpen}>
        <div className="menu_container">
          <div className="top_block">
            {/* profile + sign-out card: off with the account menu (SHOW_ACCOUNT_MENU) */}
            {SHOW_ACCOUNT_MENU && (
              <div className="user_block">
                <div className="user_icon">
                  {isLoggedIn ? <span className="user_initial">{initial}</span> : <UserRound size={20} strokeWidth={2} aria-hidden="true" />}
                </div>
                <div className="user_info">
                  {isLoggedIn ? (
                    <>
                      <p>
                        {isAgent ? <Link href="/agent/dashboard">{userName}</Link> : <button type="button">{userName}</button>}
                      </p>
                      <span>
                        <button type="button" className="user_signout" onClick={handleLogout}>
                          Sign out
                        </button>
                      </span>
                    </>
                  ) : (
                    <>
                      <p>
                        <Link href="/agent/login">Agent Login</Link>
                      </p>
                      <span>Exclusive access for subscribed partners</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <ul className="menu_list">
              <li>
                <Link href={holidaysHref(LIMITED_DEALS.key)}>
                  <p>Limited Time Deals</p>
                </Link>
              </li>
              <li>
                <Link href="/holidays">
                  <p>All Holidays</p>
                </Link>
              </li>
              {holidays.map(({ key, href, label }) => (
                <li key={key}>
                  <Link href={href}>
                    <p>{label}</p>
                  </Link>
                </li>
              ))}
              {!isAgent && (
                <li>
                  <Link href="/become-partner">
                    <p>Become a Partner</p>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/blogs">
                  <p>Blogs</p>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <p>Contact Us</p>
                </Link>
              </li>
              <li>
                <Link href="/travel-enquiry">
                  <p>Submit Enquiry</p>
                </Link>
              </li>
            </ul>
          </div>
          {/* foot: phone number + plain social icons (pickyourtrail.com's drawer) */}
          <div className="bottom_block drawer_foot">
            <a className="drawer_foot__phone" href={CONTACT.uaePhoneHref}>
              {CONTACT.uaePhone}
            </a>
            <ul className="drawer_social" aria-label="Follow Aapka Tourism">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button className="btn btn_close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <X size={18} strokeWidth={2} color="#fff" aria-hidden="true" />
        </button>
      </div>
      <div className={'menu_overlay' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)} />
    </div>
  );
}
