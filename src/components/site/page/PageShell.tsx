import Image from 'next/image';
import type { ReactNode } from 'react';
import { Mail, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import { CONTACT } from '@/components/site/site-config';
import '@/app/(marketing)/Home/ex/ex.css';
import './page-shell.css';

export function PageShell({
  kicker,
  title,
  text,
  image,
  position = 'center 45%',
  aside,
  children,
}: {
  kicker: string;
  title: string;
  text: string;
  image: string;
  position?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <main className="xp">
        <div className="xp-band" aria-hidden="true">
          <Image className="xp-band__img" src={image} alt="" fill priority unoptimized sizes="100vw" style={{ objectPosition: position }} />
        </div>
        <div className="xp-wrap">
          <div className={'xp-grid' + (aside ? '' : ' xp-grid--solo')}>
            <div className="xp-main">
              <div className="xp-intro">
                <p className="xp-kicker">{kicker}</p>
                <h1>{title}</h1>
                <p className="xp-lead">{text}</p>
              </div>
              {children}
            </div>
            {aside ? <aside className="xp-side">{aside}</aside> : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export function SideCard({ title, children, tone }: { title: string; children: ReactNode; tone?: 'lift' }) {
  return (
    <section className={'xp-card xp-sidecard' + (tone === 'lift' ? ' is-lift' : '')}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function FactList({ items }: { items: { icon: LucideIcon; title: string; text?: string }[] }) {
  return (
    <ul className="xp-facts">
      {items.map((f) => (
        <li key={f.title}>
          <span className="xp-facts__icon" aria-hidden="true">
            <f.icon />
          </span>
          <span>
            <b>{f.title}</b>
            {f.text ? <span>{f.text}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HelpCard({ text = 'Message us and we’ll usually reply within a few hours.' }: { text?: string }) {
  return (
    <SideCard title="Need help?">
      <p className="xp-sidecard__text">{text}</p>
      <a className="xp-btn xp-btn--brand xp-btn--block" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
        <MessageCircle aria-hidden="true" />
        Chat on WhatsApp
      </a>
      <ul className="xp-reach">
        <li>
          <span aria-hidden="true">
            <Phone />
          </span>
          <span>
            <small>UAE</small>
            <a href={CONTACT.uaePhoneHref}>{CONTACT.uaePhone}</a>
          </span>
        </li>
        <li>
          <span aria-hidden="true">
            <Mail />
          </span>
          <span>
            <small>Email</small>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </span>
        </li>
      </ul>
    </SideCard>
  );
}
