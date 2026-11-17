'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useIsEmbedded } from '@/hooks/use-is-embedded';
import { MessageCircleMore, MessageSquareWarning, X } from 'lucide-react';
import { isPackageDetail } from '@/components/site/chrome-routes';
import { ChatPanel } from './ChatPanel';
import { EnquiryPanel } from './EnquiryPanel';
import { expertsOnline } from './lead';
import './contact-launcher.css';

const HIDDEN_ON = ['/dashboard', '/auth', '/checkout', '/thank-you', '/influencer', '/ref', '/agent'];
const LIFTED_ON = ['/holidays'];

type PanelKind = 'chat' | 'enquiry';

export function ContactLauncher() {
  const pathname = usePathname() || '/';
  const embedded = useIsEmbedded();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [online, setOnline] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setOnline(expertsOnline()), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [menuOpen]);

  if (embedded || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const lifted = isPackageDetail(pathname) || LIFTED_ON.includes(pathname);
  const panelVisible = panel !== null && !minimized;

  const closePanel = () => {
    setPanel(null);
    setMinimized(false);
  };

  const open = (kind: PanelKind) => {
    setPanel(kind);
    setMinimized(false);
    setMenuOpen(false);
  };

  const onLauncherClick = () => {
    if (panel && minimized) {
      setMinimized(false);
      return;
    }
    if (panelVisible) {
      closePanel();
      return;
    }
    setMenuOpen((v) => !v);
  };

  const showClose = menuOpen || panelVisible;

  return (
    <div ref={root} className={`desert-ember cl-root${lifted ? ' cl-root--lifted' : ''}`}>
      {panel === 'chat' && (
        <ChatPanel
          hidden={!panelVisible}
          online={online}
          onMinimize={() => setMinimized(true)}
          onClose={closePanel}
          onRequestCallback={() => open('enquiry')}
        />
      )}
      {panel === 'enquiry' && <EnquiryPanel hidden={!panelVisible} onMinimize={() => setMinimized(true)} onClose={closePanel} />}

      {menuOpen && (
        <ul className='cl-menu'>
          <li>
            <button type='button' className='cl-option' onClick={() => open('chat')}>
              <span className='cl-option__text'>
                <strong>Chat with Aapka Tourism</strong>
                <span className={`cl-status${online ? ' is-online' : ''}`}>
                  {online ? 'Experts online · quick reply' : "Experts busy · we'll call you back"}
                </span>
              </span>
              <span className='cl-option__icon'>
                <MessageCircleMore size={20} aria-hidden />
              </span>
            </button>
          </li>
          <li>
            <button type='button' className='cl-option' onClick={() => open('enquiry')}>
              <span className='cl-option__text'>
                <strong>Quick Enquiry</strong>
                <span>Get a call back from an expert</span>
              </span>
              <span className='cl-option__icon'>
                <MessageSquareWarning size={20} aria-hidden />
              </span>
            </button>
          </li>
        </ul>
      )}

      <button
        type='button'
        className={`cl-launcher${showClose ? ' is-open' : ''}`}
        onClick={onLauncherClick}
        aria-expanded={menuOpen || panelVisible}
        aria-label={showClose ? 'Close contact options' : 'Contact us'}
      >
        {showClose ? <X size={26} aria-hidden /> : <MessageSquareWarning size={26} aria-hidden />}
      </button>
    </div>
  );
}
