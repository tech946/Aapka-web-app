'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Copy, Mail, MessageCircle, Send, Share2, X } from 'lucide-react';

/* Brand marks drawn in the site's line style (lucide dropped brand icons). */
const FacebookMark = <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />;
const XMark = <path d="M4 4l16 16M20 4 4 20" />;
const LinkedInMark = (
  <>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </>
);

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/** "Share this package": social links for the current page, copy link, and
    the device share sheet where the browser has one. */
export default function ShareDialog({ title, onClose }: { title: string; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNative(typeof navigator.share === 'function');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links: Array<{ id: string; label: string; href: string; icon: ReactNode }> = [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, icon: <MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" /> },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <Mark>{FacebookMark}</Mark> },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: <Mark>{XMark}</Mark> },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <Mark>{LinkedInMark}</Mark> },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}`, icon: <Send size={18} strokeWidth={1.8} aria-hidden="true" /> },
    { id: 'email', label: 'Email', href: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n${url}`)}`, icon: <Mail size={18} strokeWidth={1.8} aria-hidden="true" /> },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the link stays selectable in the field
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // sheet dismissed
    }
  }

  return (
    <div className="ui-modal-overlay">
      <div className="ui-modal pdp-share" role="dialog" aria-modal="true" aria-labelledby="pdp-share-title" onClick={(e) => e.stopPropagation()}>
        <div className="ui-modal__head">
          <div>
            <h2 id="pdp-share-title" className="ui-modal__title">
              Share this package
            </h2>
            <p className="ui-modal__sub">{title}</p>
          </div>
          <button type="button" className="ui-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="ui-modal__body">
          <div className="pdp-share__grid">
            {links.map((l) => (
              <a key={l.id} className={'pdp-share__item is-' + l.id} href={l.href} target="_blank" rel="noopener noreferrer">
                <span className="pdp-share__ico">{l.icon}</span>
                {l.label}
              </a>
            ))}
          </div>
          <div className="pdp-share__copy">
            <input className="ui-input" readOnly value={url} aria-label="Page link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="ui-btn ui-btn--dark" onClick={copy}>
              {copied ? <Check size={15} strokeWidth={2.4} aria-hidden="true" /> : <Copy size={15} strokeWidth={2} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          {canNative ? (
            <button type="button" className="ui-btn ui-btn--outline pdp-share__more" onClick={nativeShare}>
              <Share2 size={15} strokeWidth={2} aria-hidden="true" />
              More options
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
