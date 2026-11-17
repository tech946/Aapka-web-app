'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, Info, Menu, X } from 'lucide-react';
import { CONTACT } from '@/components/site/site-config';
import { ALL_HOLIDAYS, useHolidayMenu } from '@/components/site/useHolidayMenu';
import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import './header-mobile.css';

type CountryId = 'ae' | 'in';

const COUNTRIES: { id: CountryId; name: string; flag: string; phone: string; phoneHref: string }[] = [
  { id: 'in', name: 'India', flag: '/images/flags/in.svg', phone: CONTACT.indiaPhone, phoneHref: CONTACT.indiaPhoneHref },
  { id: 'ae', name: 'UAE', flag: '/images/flags/ae.svg', phone: CONTACT.uaePhone, phoneHref: CONTACT.uaePhoneHref },
];

const country = COUNTRIES[1];

const LOGINS = [{ label: 'Agent Login', href: '/agent/login' }];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 19 19" width="15" height="16" fill="none" aria-hidden="true" className="ex-hd__ic">
      <path
        d="M11.1243 4.74918C11.8975 4.90004 12.6081 5.27822 13.1652 5.8353C13.7223 6.39238 14.1005 7.10302 14.2513 7.87627M11.1243 1.58252C12.7308 1.76099 14.2288 2.4804 15.3725 3.62264C16.5162 4.76489 17.2376 6.26207 17.4181 7.86835M8.09772 10.9741C7.14647 10.0229 6.39535 8.94727 5.84435 7.79965C5.79695 7.70095 5.77326 7.65158 5.75505 7.58913C5.69035 7.36718 5.73682 7.09465 5.87142 6.90668C5.90929 6.85378 5.95454 6.80854 6.04503 6.71804C6.32181 6.44127 6.46019 6.30289 6.55067 6.16372C6.89187 5.63893 6.89187 4.96239 6.55067 4.43761C6.46019 4.29845 6.32181 4.16007 6.04503 3.8833L5.89076 3.72902C5.47004 3.3083 5.25968 3.09793 5.03375 2.98366C4.58443 2.7564 4.05381 2.7564 3.60448 2.98366C3.37855 3.09793 3.1682 3.3083 2.74747 3.72902L2.62268 3.85382C2.20339 4.2731 1.99375 4.48275 1.83364 4.76776C1.65597 5.08404 1.52823 5.57526 1.5293 5.93802C1.53028 6.26494 1.59369 6.48837 1.72053 6.93522C2.40213 9.33666 3.68817 11.6027 5.57865 13.4932C7.46914 15.3836 9.73514 16.6697 12.1366 17.3513C12.5834 17.4782 12.8069 17.5415 13.1338 17.5425C13.4966 17.5436 13.9878 17.4159 14.3041 17.2382C14.5891 17.078 14.7987 16.8685 15.2181 16.4491L15.3428 16.3243C15.7636 15.9037 15.9739 15.6932 16.0882 15.4673C16.3154 15.0181 16.3154 14.4874 16.0882 14.038C15.9739 13.8121 15.7636 13.6018 15.3428 13.181L15.1885 13.0268C14.9118 12.75 14.7734 12.6116 14.6342 12.5212C14.1094 12.1799 13.4329 12.1799 12.9081 12.5212C12.769 12.6116 12.6305 12.75 12.3538 13.0268C12.2633 13.1173 12.2181 13.1625 12.1651 13.2004C11.9772 13.335 11.7047 13.3815 11.4827 13.3168C11.4202 13.2986 11.3708 13.2749 11.2721 13.2275C10.1245 12.6765 9.04897 11.9253 8.09772 10.9741Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="16" fill="none" aria-hidden="true" className="ex-hd__ic">
      <path
        d="M14.75 12.4167V7.75C14.75 3.884 11.616 0.75 7.75 0.75C3.884 0.75 0.75 3.884 0.75 7.75V12.4167M2.69444 14.75C1.62056 14.75 0.75 13.8795 0.75 12.8056V11.25C0.75 10.1761 1.62056 9.30559 2.69444 9.30559C3.76833 9.30559 4.63889 10.1761 4.63889 11.25V12.8056C4.63889 13.8795 3.76833 14.75 2.69444 14.75ZM12.8056 14.75C11.7317 14.75 10.8611 13.8795 10.8611 12.8056V11.25C10.8611 10.1761 11.7317 9.30559 12.8056 9.30559C13.8795 9.30559 14.75 10.1761 14.75 11.25V12.8056C14.75 13.8795 13.8795 14.75 12.8056 14.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true" className="ex-hd__ic">
      <path
        d="M9 0C4.03735 0 0 4.03735 0 9C0 13.9626 4.03735 18 9 18C13.9626 18 18 13.9626 18 9C18 4.03735 13.9626 0 9 0ZM14.4633 14.4215C13.7732 13.0024 12.3183 12.0229 10.6348 12.0229H7.36516C5.68168 12.0229 4.22683 13.0024 3.53673 14.4215C2.15451 13.0288 1.29897 11.1126 1.29897 9C1.29897 4.75361 4.75371 1.29897 9 1.29897C13.2463 1.29897 16.701 4.75361 16.701 9C16.701 11.1126 15.8455 13.0288 14.4633 14.4215Z"
        fill="currentColor"
      />
      <path
        d="M9.00015 10.7303C10.9113 10.7303 12.4605 9.18103 12.4605 7.26993C12.4605 5.35882 10.9113 3.80957 9.00015 3.80957C7.08905 3.80957 5.53979 5.35882 5.53979 7.26993C5.53979 9.18103 7.08905 10.7303 9.00015 10.7303Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Drop({
  label,
  button,
  children,
  align = 'right',
}: {
  label: string;
  button: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="ex-hd__drop" ref={root}>
      <button type="button" className="ex-hd__item" aria-expanded={open} aria-haspopup="menu" aria-label={label} onClick={() => setOpen((v) => !v)}>
        {button}
        <ChevronDown className="ex-hd__chev" aria-hidden="true" />
      </button>
      {open ? (
        <div className={'ex-hd__menu' + (align === 'left' ? ' ex-hd__menu--left' : '')} role="menu">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export default function ExHeader() {
  const [drawer, setDrawer] = useState(false);
  const items = useHolidayMenu();

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  const links = [
    { key: ALL_HOLIDAYS.key, href: ALL_HOLIDAYS.href, label: ALL_HOLIDAYS.label },
    ...items.map((i) => ({ key: i.key, href: i.href, label: i.label })),
    ...(items.some((i) => i.key === LIMITED_DEALS.key) ? [] : [{ key: LIMITED_DEALS.key, href: holidaysHref(LIMITED_DEALS.key), label: 'Deals' }]),
    { key: 'blogs', href: '/blogs', label: 'Blogs' },
    { key: 'about', href: '/About', label: 'About Us' },
    { key: 'contact', href: '/contact', label: 'Contact Us' },
  ];

  return (
    <>
      <header className="ex-header">
        <div className="ex-header__bar">
          <button type="button" className="ex-header__burger" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu aria-hidden="true" />
          </button>
          <Link href="/" className="ex-logo" aria-label="Aapka Tourism home">
            <img src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="Aapka Tourism" />
          </Link>
          <div className="ex-hd ex-hd--start">
            <Drop label="Holidays" align="left" button={<b className="ex-hd__text">Holidays</b>}>
              {(close) =>
                [ALL_HOLIDAYS, ...items].map((item) => (
                  <Link key={item.key} href={item.href} className="ex-hd__option" role="menuitem" onClick={close}>
                    {item.label}
                  </Link>
                ))
              }
            </Drop>
          </div>
          <div className="ex-hd">
            <Drop
              label="Call us"
              button={
                <>
                  <PhoneIcon />
                  <b className="ex-hd__text">{country.phone}</b>
                </>
              }
            >
              {(close) =>
                COUNTRIES.map((c) => (
                  <a key={c.id} href={c.phoneHref} className="ex-hd__option" role="menuitem" onClick={close}>
                    <img src={c.flag} width="20" height="14" alt="" />
                    <span>
                      <small>{c.name}</small>
                      {c.phone}
                    </span>
                  </a>
                ))
              }
            </Drop>
            <span className="ex-hd__divider" aria-hidden="true" />
            <Link href="/About" className="ex-hd__item">
              <Info className="ex-hd__ic" width={16} height={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="ex-hd__text">About Us</span>
            </Link>
            <span className="ex-hd__divider" aria-hidden="true" />
            <Link href="/contact" className="ex-hd__item">
              <HeadsetIcon />
              <span className="ex-hd__text">Contact Us</span>
            </Link>
            <span className="ex-hd__divider" aria-hidden="true" />
            <Drop
              label="Login"
              button={
                <>
                  <UserIcon />
                  <span className="ex-hd__text">Login</span>
                </>
              }
            >
              {(close) =>
                LOGINS.map((l) => (
                  <Link key={l.href} href={l.href} className="ex-hd__option" role="menuitem" onClick={close}>
                    {l.label}
                  </Link>
                ))
              }
            </Drop>
          </div>
        </div>
      </header>
      {drawer && (
        <div className="ex-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="ex-drawer__head">
            <img src="/aapka-tourism-logo-light.png" width="404" height="322" alt="Aapka Tourism" />
            <button type="button" className="ex-header__burger" aria-label="Close menu" onClick={() => setDrawer(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
          <ul className="ex-drawer__list">
            {links.map((item) => (
              <li key={item.key}>
                <Link href={item.href} onClick={() => setDrawer(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a href={country.phoneHref} className="ex-btn ex-btn--light ex-drawer__call">
            Call {country.phone}
          </a>
        </div>
      )}
    </>
  );
}
